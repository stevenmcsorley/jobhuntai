const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const knexConfig = require('../knexfile').development;
const knex = require('knex')(knexConfig);
const CWJobsAdapter = require('./adapters/cwjobs');
const LinkedInAdapter = require('./adapters/linkedin');
const IndeedAdapter = require('./adapters/indeed');
const scraper = require('./services/scraper');
const matcher = require('./services/matcher');
const analyzer = require('./services/analyzer');
const applier = require('./services/applier');
const interviewPrep = require('./services/interviewPrep');
const coverLetterGenerator = require('./services/coverLetterGenerator');
const companyInfoGenerator = require('./services/companyInfoGenerator');
const testGenerator = require('./services/testGenerator');
const guidanceGenerator = require('./services/guidanceGenerator');
const cvTailor = require('./services/cvTailor');
const skillExtractor = require('./services/skillExtractor');
const fs = require('fs').promises;
const { runProactiveHunt } = require('./services/proactiveHunter');

const profileRoutes = require('./api/routes/profile');

const config = require('../config.json');

const app = express();
app.use(express.json({ limit: '5mb' })); // Increase limit for CV content

app.use('/api/profile', profileRoutes);

const PORT = process.env.PORT || 5003;

// -- Routes --

// GET /jobs - list all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await knex('jobs').select('*');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs - manually add a new job
app.post('/api/jobs', async (req, res) => {
  try {
    const { title, company, location, url, description } = req.body;

    if (!title || !company || !url) {
      return res.status(400).json({ error: 'Title, Company, and URL are required.' });
    }

    // Use a transaction to ensure both inserts succeed or fail together
    const [newJob] = await knex.transaction(async (trx) => {
      const job = {
        title,
        company,
        location,
        url,
        description,
        scraped_at: new Date().toISOString(),
        source: 'manual'
      };
      const [insertedJob] = await trx('jobs').insert(job).returning('*');

      const application = {
        job_id: insertedJob.id,
        status: 'followup', // Start in the 'Follow-up' list
        applied_at: new Date().toISOString(),
        meta: JSON.stringify({ note: 'Manually added job.' })
      };
      const [insertedApp] = await trx('applications').insert(application).returning('*');

      // Combine the results to return to the frontend
      return [{ job: insertedJob, application: insertedApp }];
    });

    res.status(201).json(newJob);

  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: jobs.url')) {
      return res.status(409).json({ error: 'A job with this URL already exists.' });
    }
    console.error('Error adding manual job:', err);
    res.status(500).json({ error: 'Failed to add job.', details: err.message });
  }
});

// POST /api/jobs/bulk - bulk add new jobs from JSON
app.post('/api/jobs/bulk', async (req, res) => {
  try {
    const jobs = req.body;

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({ error: 'Request body must be a non-empty array of jobs.' });
    }

    let insertedCount = 0;
    let failedCount = 0;
    const errors = [];

    await knex.transaction(async (trx) => {
      // Use a for...of loop to process jobs serially, ensuring reliability with SQLite
      for (const jobData of jobs) {
        const { title, company, url, location, description, posted, salary } = jobData;

        if (!title || !company || !url) {
          failedCount++;
          errors.push({ url: url || 'N/A', reason: 'Missing required fields: title, company, and url.' });
          continue;
        }

        try {
          const job = {
            title,
            company,
            url,
            location,
            description,
            posted,
            salary,
            scraped_at: new Date().toISOString(),
            source: 'manual-bulk'
          };
          
          const [insertedId] = await trx('jobs').insert(job);

          const application = {
            job_id: insertedId,
            status: 'opportunity',
            applied_at: new Date().toISOString(),
            meta: JSON.stringify({ note: 'Bulk imported job.' })
          };
          await trx('applications').insert(application);
          insertedCount++;
        } catch (err) {
          failedCount++;
          if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: jobs.url')) {
            errors.push({ url, reason: 'Job with this URL already exists.' });
          } else {
            errors.push({ url, reason: `An unexpected error occurred: ${err.message}` });
          }
        }
      }
    });

    res.status(201).json({ 
      message: `Bulk import complete. Successfully added ${insertedCount} jobs. Failed to add ${failedCount} jobs.`,
      errors
    });

  } catch (err) {
    console.error('Error during bulk job import:', err);
    res.status(500).json({ error: 'Failed to import jobs.', details: err.message });
  }
});


// POST /jobs/scrape?source=cwjobs - trigger a new scrape for a specific source
app.post('/api/jobs/scrape', async (req, res) => {
  try {
    const source = req.query.source || 'cwjobs'; // Default to cwjobs
    let adapter;

    // Fetch preferences to build the dynamic URL
    const prefs = await knex('preferences').select('*');
    const preferences = prefs.reduce((obj, item) => {
      obj[item.key] = item.value;
      return obj;
    }, {});

    if (source === 'cwjobs') {
      const keywords = encodeURIComponent((preferences.keywords || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim());
      const town = encodeURIComponent((preferences.town || '').toLowerCase().trim());
      const radius = preferences.radius || '30';
      const searchUrl = `https://www.cwjobs.co.uk/jobs/${keywords.replace(/%20/g, '-').toLowerCase()}/in-${town}?radius=${radius}`;

      adapter = new CWJobsAdapter({
        loginUrl: 'https://www.cwjobs.co.uk/account/signin',
        searchUrl: searchUrl,
        email: process.env.CWJOBS_EMAIL,
        password: process.env.CWJOBS_PASSWORD,
        keywords: preferences.keywords,
        location: preferences.location
      });
    } else if (source === 'linkedin') {
       const keywords = encodeURIComponent((preferences.keywords || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim());
       const location = encodeURIComponent((preferences.location || '').toLowerCase().trim());
       const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${location}`;
      
      adapter = new LinkedInAdapter({
        searchUrl: searchUrl,
        email: process.env.LINKEDIN_EMAIL,
        password: process.env.LINKEDIN_PASSWORD
      });
    } else if (source === 'indeed') {
      const keywords = encodeURIComponent((preferences.keywords || '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim());
      const location = encodeURIComponent((preferences.location || '').toLowerCase().trim());
      const searchUrl = `https://www.indeed.co.uk/jobs?q=${keywords}&l=${location}`;

      adapter = new IndeedAdapter({
        searchUrl: searchUrl
      });
    } else {
      return res.status(400).json({ error: 'Invalid source specified' });
    }

    const stackKeywords = preferences.stack_keywords ? preferences.stack_keywords.split(',').map(k => k.trim().toLowerCase()) : [];
    const newJobs = await scraper.scrapeAndSave(knex, [adapter], stackKeywords);

    if (newJobs.length === 0) {
        return res.json({ message: `Cycle complete for ${source}. No new jobs to process.` });
    }

    // Analyze each new job to fetch and store full descriptions before creating applications
    const analyzedJobs = [];
    for (const job of newJobs) {
      try {
        const analyzed = await analyzer.analyzeAndSaveJob(knex, job);
        analyzedJobs.push(analyzed);
      } catch (e) {
        console.error(`Error analyzing job ${job.id}:`, e.message);
        // Fallback to original job if analysis fails
        analyzedJobs.push(job);
      }
    }

    // Create an 'opportunity' record for each new job
    for (const job of analyzedJobs) {
      await knex('applications').insert({
        job_id: job.id,
        status: 'opportunity',
        applied_at: new Date().toISOString(),
        meta: JSON.stringify({ note: 'Found by manual scrape.' })
      });
    }

    console.log(`✅ Manual scrape complete for ${source}. Found and saved ${analyzedJobs.length} new job(s) as opportunities.`);

    res.status(201).json({ message: `Scraped and saved ${analyzedJobs.length} new jobs from ${source}.`, jobs: analyzedJobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    // Clean up any open browser instances
    await matcher.closeBrowser();
    await applier.closeBrowser();
    await analyzer.closeBrowser();
  }
});

// POST /jobs/:id/match - run CV matcher on one job
app.post('/api/jobs/:id/match', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const result = await matcher.matchJob(knex, job);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /jobs/:id/apply - attempt application
app.post('/api/jobs/:id/apply', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        // For direct application, we assume a positive match or skip matching
        const matchResult = req.body.matchResult || { match: true, score: null, reasons: [] };
        await applier.applyToJob(knex, job, matchResult);
        res.json({ message: `Application process initiated for job ${job.id}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/jobs/:id/analyze - scrape and store job description
app.post('/api/jobs/:id/analyze', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const updatedJob = await analyzer.analyzeAndSaveJob(knex, job);
        res.json(updatedJob);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/jobs/:id/interview-prep - generate interview prep
app.post('/api/jobs/:id/interview-prep', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job || !job.description) {
            return res.status(400).json({ error: 'Job must be analyzed first' });
        }
        const prepData = await interviewPrep.generateInterviewPrep(job);

        // Save the generated data to the job record
        await knex('jobs')
            .where({ id: job.id })
            .update({ interview_prep: JSON.stringify(prepData) });

        // Fetch the updated job to return to the client
        const updatedJob = await knex('jobs').where({ id: job.id }).first();

        res.json(updatedJob);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/jobs/:id/generate-cover-letter - generate a cover letter
app.post('/api/jobs/:id/generate-cover-letter', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job || !job.description) {
            return res.status(400).json({ error: 'Job must be analyzed first' });
        }

        // Fetch the full master profile
        const profile = await require('./api/routes/profile').getFullProfile();

        const coverLetterText = await coverLetterGenerator.generateCoverLetter(job, profile);

        // Save the generated data to the job record
        await knex('jobs')
            .where({ id: job.id })
            .update({ cover_letter: coverLetterText });

        // Fetch the updated job to return to the client
        const updatedJob = await knex('jobs').where({ id: job.id }).first();

        res.json(updatedJob);
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate cover letter.', details: err.message });
    }
});

// POST /api/jobs/:id/generate-company-info - generate company info
app.post('/api/jobs/:id/generate-company-info', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job || !job.company) {
            return res.status(400).json({ error: 'Job must have a company name' });
        }

        const companyInfoText = await companyInfoGenerator.generateCompanyInfo(job.company);

        await knex('jobs')
            .where({ id: job.id })
            .update({ company_info: companyInfoText });

        const updatedJob = await knex('jobs').where({ id: req.params.id }).first();
        res.json(updatedJob);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/jobs/:id/auto-apply - trigger the auto-apply logic for a single job
app.post('/api/jobs/:id/auto-apply', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        if (job.source !== 'cwjobs') {
            return res.status(400).json({ error: 'Auto-apply is only available for jobs from CWJobs.' });
        }

        // We can invent a "perfect" match result since this is a manual override
        const matchResult = { match: true, score: 1.0, reasons: ['Manual trigger'] };
        const result = await applier.applyToJob(knex, job, matchResult);

        // The applier service handles DB updates, so we just return its result
        res.json(result);

    } catch (err) {
        res.status(500).json({ error: 'Failed to run auto-apply.', details: err.message });
    }
});

// POST /api/jobs/:id/tailor-cv - generate a tailored CV
app.post('/api/jobs/:id/tailor-cv', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job || !job.description) {
            return res.status(400).json({ error: 'Job must be analyzed first' });
        }

        // Fetch the full master profile
        const profile = await require('./api/routes/profile').getFullProfile();

        const tailoredCvText = await cvTailor.tailorCv(job, profile);

        // Save the generated CV to the 'tailored_cv' field
        await knex('jobs')
            .where({ id: job.id })
            .update({ tailored_cv: tailoredCvText });

        const updatedJob = await knex('jobs').where({ id: job.id }).first();
        res.json(updatedJob);
    } catch (err) {
        res.status(500).json({ error: 'Failed to tailor CV.', details: err.message });
    }
});

// POST /api/jobs/:id/extract-skills - extract skills from a job description
app.post('/api/jobs/:id/extract-skills', async (req, res) => {
    try {
        const job = await knex('jobs').where({ id: req.params.id }).first();
        if (!job || !job.description) {
            return res.status(400).json({ error: 'Job must have a description to extract skills.' });
        }

        const skills = await skillExtractor.extractSkills(job.description);

        await knex('jobs')
            .where({ id: job.id })
            .update({ skills: JSON.stringify(skills) });

        const updatedJob = await knex('jobs').where({ id: job.id }).first();
        res.json(updatedJob);
    } catch (err) {
        res.status(500).json({ error: 'Failed to extract skills.', details: err.message });
    }
});


// PATCH /api/jobs/:id - update a job's details
app.patch('/api/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description } = req.body;

        const updatedCount = await knex('jobs')
            .where({ id })
            .update({ description });

        if (updatedCount > 0) {
            const updatedJob = await knex('jobs').where({ id }).first();
            res.json(updatedJob);
        } else {
            res.status(404).json({ error: 'Job not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET /applications
app.get('/api/applications', async (req, res) => {
    try {
        const applications = await knex('applications').select('*');
        res.json(applications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/applications/:id - update application status
app.patch('/api/applications/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const updatedCount = await knex('applications')
            .where({ id })
            .update({ status });

        if (updatedCount > 0) {
            const updatedApplication = await knex('applications').where({ id }).first();
            res.json(updatedApplication);
        } else {
            res.status(404).json({ error: 'Application not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/applications/:id/notes - get all notes for an application
app.get('/api/applications/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const notes = await knex('application_notes')
            .where({ application_id: id })
            .orderBy('created_at', 'desc');
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notes.', details: err.message });
    }
});

// POST /api/applications/:id/notes - add a new note to an application
app.post('/api/applications/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        if (!note) {
            return res.status(400).json({ error: 'Note content is required.' });
        }

        const [newNote] = await knex('application_notes').insert({
            application_id: id,
            note,
        }).returning('*');

        res.status(201).json(newNote);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add note.', details: err.message });
    }
});

// DELETE /api/applications/:id - delete an application and associated job
app.delete('/api/applications/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const appToDelete = await knex('applications').where({ id }).first();

        if (!appToDelete) {
            return res.status(404).json({ error: 'Application not found' });
        }

        // Get the job_id before deleting the application
        const jobId = appToDelete.job_id;

        // Delete the application record
        await knex('applications').where({ id }).del();

        // Now delete the associated job record. The CASCADE will handle matches.
        await knex('jobs').where({ id: jobId }).del();

        res.status(200).json({ message: 'Application and associated job deleted successfully.' });
    } catch (err) {
        console.error('Error deleting application:', err);
        res.status(500).json({ error: 'Failed to delete application.', details: err.message });
    }
});

// GET /matches
app.get('/api/matches', async (req, res) => {
    try {
        const matches = await knex('matches').select('*');
        res.json(matches);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/stats - get dashboard stats
app.get('/api/stats', async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const appliedTodayPromise = knex('applications')
            .where('status', 'applied')
            .andWhere('applied_at', '>=', today)
            .count('id as count')
            .first();

        const appliedThisWeekPromise = knex('applications')
            .where('status', 'applied')
            .andWhere('applied_at', '>=', sevenDaysAgo)
            .count('id as count')
            .first();

        const applicationsByDayPromise = knex('applications')
            .select(knex.raw("strftime('%Y-%m-%d', applied_at) as date"))
            .count('id as count')
            .where('status', 'applied')
            .andWhere('applied_at', '>=', sevenDaysAgo)
            .groupBy('date');
            
        const sourcePerformancePromise = knex('jobs')
            .join('applications', 'jobs.id', '=', 'applications.job_id')
            .where('applications.status', 'applied')
            .select('source')
            .count('applications.id as count')
            .groupBy('source')
            .orderBy('count', 'desc');

        const statusBreakdownPromise = knex('applications')
            .select('status')
            .count('id as count')
            .groupBy('status')
            .orderBy('count', 'desc');

        const [
            appliedToday,
            appliedThisWeek,
            applicationsByDay,
            sourcePerformance,
            statusBreakdown
        ] = await Promise.all([
            appliedTodayPromise,
            appliedThisWeekPromise,
            applicationsByDayPromise,
            sourcePerformancePromise,
            statusBreakdownPromise
        ]);

        res.json({
            appliedToday: appliedToday.count,
            appliedThisWeek: appliedThisWeek.count,
            applicationsByDay,
            sourcePerformance,
            statusBreakdown
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
  }
});

// GET /api/cv - get CV content
app.get('/api/cv', async (req, res) => {
    try {
        const cvPath = path.resolve(__dirname, '../cv.txt');
        const cvContent = await fs.readFile(cvPath, 'utf-8');
        res.json({ content: cvContent });
    } catch (err) {
        if (err.code === 'ENOENT') {
            return res.json({ content: '' }); // Return empty if file doesn't exist
        }
        res.status(500).json({ error: 'Failed to read CV file.', details: err.message });
    }
});

// POST /api/cv - update CV content
app.post('/api/cv', async (req, res) => {
    try {
        const { content } = req.body;
        if (typeof content !== 'string') {
            return res.status(400).json({ error: 'Invalid content provided.' });
        }
        const cvPath = path.resolve(__dirname, '../cv.txt');
        await fs.writeFile(cvPath, content, 'utf-8');
        res.json({ message: 'CV updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save CV file.', details: err.message });
    }
});

// GET /api/interviews - list all interviews
app.get('/api/interviews', async (req, res) => {
    try {
        const interviews = await knex('interviews')
            .join('applications', 'interviews.application_id', '=', 'applications.id')
            .join('jobs', 'applications.job_id', '=', 'jobs.id')
            .select(
                'interviews.id',
                'interviews.interview_date',
                'interviews.interview_type',
                'interviews.notes',
                'jobs.title as job_title',
                'jobs.company as company_name'
            )
            .orderBy('interviews.interview_date', 'desc');
        res.json(interviews);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch interviews.', details: err.message });
    }
});

// POST /api/applications/:id/interviews - add an interview for an application
app.post('/api/applications/:id/interviews', async (req, res) => {
    try {
        const { interview_date, interview_type, notes } = req.body;
        const application_id = req.params.id;

        if (!interview_date || !interview_type) {
            return res.status(400).json({ error: 'Interview date and type are required.' });
        }

        const [newInterview] = await knex('interviews').insert({
            application_id,
            interview_date,
            interview_type,
            notes
        }).returning('*');

        // Also update the application status to 'interview'
        await knex('applications').where({ id: application_id }).update({ status: 'interview' });

        res.status(201).json(newInterview);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add interview.', details: err.message });
    }
});

// POST /api/applications/:id/apply - apply for a job from an existing application
app.post('/api/applications/:id/apply', async (req, res) => {
    try {
        const application = await knex('applications').where({ id: req.params.id }).first();
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        const job = await knex('jobs').where({ id: application.job_id }).first();
        if (!job) {
            return res.status(404).json({ error: 'Associated job not found' });
        }

        // We assume a positive match since it's an opportunity
        const matchResult = { match: true, score: null, reasons: ['Manual approval from opportunities'] };
        await applier.applyToJob(knex, job, matchResult);

        res.json({ message: `Application process initiated for job ${job.id}` });
    } catch (err) {
        res.status(500).json({ error: 'Failed to apply for job.', details: err.message });
    }
});

// GET /api/preferences - get all preferences
app.get('/api/preferences', async (req, res) => {
    try {
        const prefs = await knex('preferences').select('*');
        // Convert from array of {key, value} to a single object
        const preferencesObject = prefs.reduce((obj, item) => {
            obj[item.key] = item.value;
            return obj;
        }, {});
        res.json(preferencesObject);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch preferences.', details: err.message });
    }
});

// POST /api/preferences - update preferences
app.post('/api/preferences', async (req, res) => {
    try {
        const preferences = req.body;
        const queries = Object.keys(preferences).map(key => {
            return knex('preferences')
                .insert({ key, value: preferences[key] })
                .onConflict('key')
                .merge();
        });
        await Promise.all(queries);
        res.json({ message: 'Preferences updated successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save preferences.', details: err.message });
    }
});

// GET /api/dashboard-stats - get detailed dashboard stats
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        const sourcePerformance = await knex('jobs')
            .join('applications', 'jobs.id', '=', 'applications.job_id')
            .where('applications.status', 'applied')
            .select('source')
            .count('applications.id as count')
            .groupBy('source')
            .orderBy('count', 'desc');

        const statusBreakdown = await knex('applications')
            .select('status')
            .count('id as count')
            .groupBy('status')
            .orderBy('count', 'desc');

        const companyFrequency = await knex('jobs')
            .select('company')
            .count('id as count')
            .groupBy('company')
            .orderBy('count', 'desc')
            .limit(10);

        const weeklySubmissions = await knex('applications')
            .select(knex.raw("strftime('%Y-%W', applied_at) as week"))
            .count('id as count')
            .where('status', 'applied')
            .groupBy('week')
            .orderBy('week', 'asc');

        res.json({
            sourcePerformance,
            statusBreakdown,
            companyFrequency,
            weeklySubmissions
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/hunt - trigger the proactive job hunter
app.post('/api/hunt', async (req, res) => {
    try {
        // Run the hunt in the background, don't wait for it to finish
        runProactiveHunt().catch(err => {
            console.error("A background hunt failed:", err);
        });
        res.status(202).json({ message: 'Proactive job hunt initiated. New opportunities will appear on the dashboard as they are found.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to start the job hunt.', details: err.message });
    }
});

// GET /api/market-fit - analyze job descriptions for skill frequency
app.get('/api/market-fit', async (req, res) => {
    try {
        const jobsWithSkills = await knex('jobs').whereNotNull('skills').select('skills');
        const totalJobs = jobsWithSkills.length;

        if (totalJobs === 0) {
            return res.json({
                message: 'No jobs with extracted skills available to analyze. Extract some skills from jobs first!',
                analysis: []
            });
        }

        const skillCounts = jobsWithSkills.reduce((acc, job) => {
            const skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
            if (Array.isArray(skills)) {
                skills.forEach(skill => {
                    acc[skill] = (acc[skill] || 0) + 1;
                });
            }
            return acc;
        }, {});

        const sortedSkills = Object.entries(skillCounts)
            .map(([skill, count]) => ({
                skill,
                count,
                percentage: Math.round((count / totalJobs) * 100)
            }))
            .sort((a, b) => b.count - a.count);

        res.json({
            totalJobsAnalyzed: totalJobs,
            analysis: sortedSkills
        });

    } catch (err) {
        console.error('Error during market-fit analysis:', err);
        res.status(500).json({ error: 'Failed to analyze market fit.', details: err.message });
    }
});

// -- Test Hub Endpoints --

// POST /api/tests/start - Start a new test session
app.post('/api/tests/start', async (req, res) => {
    try {
        const { skill, difficulty, type } = req.body;
        if (!skill || !difficulty || !type) {
            return res.status(400).json({ error: 'Skill, difficulty, and type are required.' });
        }

        const questionCount = type === 'code_challenge' ? 1 : 5;
        const questions = await testGenerator.generateTestQuestions(skill, difficulty, type, questionCount);

        const [session] = await knex('test_sessions').insert({
            skill,
            difficulty,
            type,
            completed_at: new Date().toISOString()
        }).returning('*');

        // Save questions but don't send answers to the client
        for (const q of questions) {
            await knex('test_results').insert({
                session_id: session.id,
                question_text: q.question,
                correct_answer: JSON.stringify(q.answer),
                options: q.options ? JSON.stringify(q.options) : null
            });
        }

        // Send back the session and the first question
        const firstQuestion = await knex('test_results').where({ session_id: session.id }).first();
        // The 'options' are already on the firstQuestion object after being inserted.
        res.status(201).json({ session, question: firstQuestion });

    } catch (err) {
        res.status(500).json({ error: 'Failed to start test session.', details: err.message });
    }
});

// POST /api/tests/submit-answer - Submit an answer and get the next question
app.post('/api/tests/submit-answer', async (req, res) => {
    try {
        const { result_id, answer } = req.body;
        const result = await knex('test_results').where({ id: result_id }).first();
        if (!result) {
            return res.status(404).json({ error: 'Test result not found.' });
        }

        const session = await knex('test_sessions').where({ id: result.session_id }).first();
        const evaluation = await testGenerator.evaluateAnswer(result.question_text, result.correct_answer, answer, session.type);

        let isCorrect, feedback;
        if (session.type.startsWith('behavioral_')) {
            isCorrect = evaluation.overall_score > 60; // Consider >60 a "pass" for behavioral
            feedback = JSON.stringify(evaluation); // Store the whole object
        } else {
            isCorrect = evaluation.is_correct;
            feedback = evaluation.feedback;
        }

        await knex('test_results').where({ id: result_id }).update({
            user_answer: answer,
            feedback: feedback,
            is_correct: isCorrect
        });

        const nextQuestion = await knex('test_results')
            .where({ session_id: result.session_id })
            .andWhere('user_answer', null)
            .first();

        if (!nextQuestion) {
            // Test is complete, calculate and save the final score
            const allResults = await knex('test_results').where({ session_id: result.session_id });
            let finalScore;
            if (session.type === 'behavioral') {
                const totalScore = allResults.reduce((sum, r) => sum + JSON.parse(r.feedback).overall_score, 0);
                finalScore = totalScore / allResults.length;
            } else {
                const correctCount = allResults.filter(r => r.is_correct).length;
                finalScore = (correctCount / allResults.length) * 100;
            }
            await knex('test_sessions').where({ id: result.session_id }).update({ score: finalScore.toFixed(2) });
        }

        res.json({ evaluation, nextQuestion });

    } catch (err) {
        res.status(500).json({ error: 'Failed to submit answer.', details: err.message });
    }
});

// GET /api/tests/history - Get all past test sessions
app.get('/api/tests/history', async (req, res) => {
    try {
        const history = await knex('test_sessions').select('*').orderBy('completed_at', 'desc');
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch test history.', details: err.message });
    }
});

// GET /api/tests/sessions/:id - Get the full results for a single test session
app.get('/api/tests/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await knex('test_sessions').where({ id }).first();
        if (!session) {
            return res.status(404).json({ error: 'Test session not found.' });
        }
        const results = await knex('test_results').where({ session_id: id });
        res.json({ session, results });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch test session results.', details: err.message });
    }
});

// GET /api/tests/prompts - Get the prompt matrix
app.get('/api/tests/prompts', (req, res) => {
    res.json(testGenerator.getPromptMatrix());
});

// POST /api/tests/sessions/:id/reset-incorrect - Reset incorrect answers for a session to allow a retake
app.post('/api/tests/sessions/:id/reset-incorrect', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await knex('test_sessions').where({ id }).first();
        if (!session) {
            return res.status(404).json({ error: 'Test session not found.' });
        }

        const incorrectResultIds = await knex('test_results')
            .where({ session_id: id, is_correct: false })
            .select('id');

        if (incorrectResultIds.length === 0) {
            return res.status(400).json({ error: 'No incorrect answers to retake in this session.' });
        }

        await knex('test_results')
            .whereIn('id', incorrectResultIds.map(r => r.id))
            .update({
                user_answer: null,
                feedback: null,
                is_correct: null
            });
        
        // Also reset the overall score
        await knex('test_sessions').where({ id }).update({ score: null });

        const firstQuestion = await knex('test_results').where({ session_id: id }).whereNull('user_answer').first();
        const totalQuestions = incorrectResultIds.length;

        res.json({ 
            session, 
            question: firstQuestion, 
            totalQuestions
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to reset test session.', details: err.message });
    }
});

// GET /api/tests/sessions/:id/continue - Continue an in-progress test
app.get('/api/tests/sessions/:id/continue', async (req, res) => {
    try {
        const { id } = req.params;
        const session = await knex('test_sessions').where({ id }).first();
        if (!session) {
            return res.status(404).json({ error: 'Test session not found.' });
        }

        const firstUnanswered = await knex('test_results')
            .where({ session_id: id })
            .whereNull('user_answer')
            .first();
            
        if (!firstUnanswered) {
            return res.status(400).json({ error: 'This test has already been completed.' });
        }

        // The 'options' are already on the firstUnanswered object, so we just return it.
        const allQuestions = await knex('test_results').where({ session_id: id });
        const answeredCount = allQuestions.filter(q => q.user_answer !== null).length;

        res.json({
            session,
            question: firstUnanswered,
            questionNumber: answeredCount + 1,
            totalQuestions: allQuestions.length
        });

    } catch (err) {
        res.status(500).json({ error: 'Failed to continue test session.', details: err.message });
    }
});

// DELETE /api/tests/sessions/:id - Delete a test session and all its results
app.delete('/api/tests/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // The 'onDelete("CASCADE")' in the migration will handle deleting the associated test_results.
        const deletedCount = await knex('test_sessions').where({ id }).del();

        if (deletedCount > 0) {
            res.status(200).json({ message: 'Test session deleted successfully.' });
        } else {
            res.status(404).json({ error: 'Test session not found.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete test session.', details: err.message });
    }
});


// -- Guidance Hub Endpoints --

// GET /api/guidance/summary - Get a summary of weakest topics
app.get('/api/guidance/summary', async (req, res) => {
    try {
        const summary = await knex('test_sessions')
            .select('skill')
            .avg('score as average_score')
            .groupBy('skill')
            .orderBy('average_score', 'asc');
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch guidance summary.', details: err.message });
    }
});

// GET /api/guidance/:topic - Get a detailed learning plan for a topic
app.get('/api/guidance/:topic', async (req, res) => {
    try {
        const { topic } = req.params;
        
        const incorrectResults = await knex('test_sessions')
            .join('test_results', 'test_sessions.id', '=', 'test_results.session_id')
            .where('test_sessions.skill', topic)
            .andWhereNot('test_results.is_correct', true)
            .select('test_results.*');

        if (incorrectResults.length === 0) {
            return res.json({
                guidance: {
                    summary_of_weaknesses: "No weaknesses found for this topic!",
                    learning_plan: ["You haven't answered any questions on this topic incorrectly. Keep up the great work!"]
                },
                incorrectResults
            });
        }

        const incorrectResultIds = incorrectResults.map(r => r.id).sort();

        // Check for existing, valid guidance
        const savedGuidance = await knex('guidance').where({ skill: topic }).first();
        if (savedGuidance) {
            const savedResultIds = JSON.parse(savedGuidance.source_result_ids).sort();
            // If the incorrect answers are the same as last time, return the saved guidance
            if (JSON.stringify(incorrectResultIds) === JSON.stringify(savedResultIds)) {
                console.log(`🧠 Found valid saved guidance for "${topic}". Serving from cache.`);
                return res.json({
                    guidance: JSON.parse(savedGuidance.guidance_text),
                    incorrectResults
                });
            }
        }

        // If no valid guidance exists, generate it
        console.log(`✨ Generating new guidance for "${topic}"...`);
        const guidance = await guidanceGenerator.generateGuidance(topic, incorrectResults);

        // Save the new guidance to the database
        await knex('guidance')
            .insert({
                skill: topic,
                guidance_text: JSON.stringify(guidance),
                source_result_ids: JSON.stringify(incorrectResultIds)
            })
            .onConflict('skill')
            .merge();
        
        console.log(`💾 Saved new guidance for "${topic}" to the database.`);

        res.json({ guidance, incorrectResults });

    } catch (err) {
        res.status(500).json({ error: 'Failed to generate guidance.', details: err.message });
    }
});


// -- Orchestration Endpoint --

app.post('/api/run', async (req, res) => {
    console.log('🚀 Starting full job scrape, match, and apply cycle...');
    try {
        // 1. Scrape for new jobs
        const adapters = [
          new CWJobsAdapter({
            loginUrl: 'https://www.cwjobs.co.uk/account/signin',
            searchUrl: config.cwjobs.searchUrl,
            email: process.env.CWJOBS_EMAIL,
            password: process.env.CWJOBS_PASSWORD
          }),
          new LinkedInAdapter({
            searchUrl: config.linkedin.searchUrl,
            email: process.env.LINKEDIN_EMAIL,
            password: process.env.LINKEDIN_PASSWORD
          }),
          new IndeedAdapter({
            searchUrl: config.indeed.searchUrl
          })
        ];
        const newJobs = await scraper.scrapeAndSave(knex, adapters);

        if (newJobs.length === 0) {
            return res.json({ message: 'Cycle complete. No new jobs to process.' });
        }

        // 2. Match and apply to new jobs
        for (const job of newJobs) {
            // First, analyze the job to get the description
            const analyzedJob = await analyzer.analyzeAndSaveJob(knex, job);

            // Then, match against the full job details
            const matchResult = await matcher.matchJob(knex, analyzedJob);
            if (matchResult.match) {
                await applier.applyToJob(knex, analyzedJob, matchResult);
            } else {
                await knex('applications').insert({
                    job_id: analyzedJob.id,
                    status: 'rejected',
                    meta: JSON.stringify({
                        score: matchResult.score,
                        reasons: matchResult.reasons
                    })
                });
            }
        }

        res.json({ message: `Cycle complete. Processed ${newJobs.length} new jobs.` });

    } catch (err) {
        console.error('❌ Error during full run:', err);
        res.status(500).json({ error: 'An error occurred during the run.', details: err.message });
    } finally {
        // Clean up any open browser instances
        await matcher.closeBrowser();
        await applier.closeBrowser();
        await analyzer.closeBrowser();
    }
});


app.listen(PORT, () => {
  console.log(`🚀 Job application server listening on http://localhost:${PORT}`);
});
