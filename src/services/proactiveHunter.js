const knex = require('knex')(require('../../knexfile').development);
const CWJobsAdapter = require('../adapters/cwjobs');
const LinkedInAdapter = require('../adapters/linkedin');
const IndeedAdapter = require('../adapters/indeed');
const scraper = require('./scraper');
const analyzer = require('./analyzer');
const matcher = require('./matcher');

async function runProactiveHunt() {
  console.log('🚀 Starting Proactive Job Hunt...');

  try {
    // 1. Fetch Preferences
    const prefs = await knex('preferences').select('*');
    const preferences = prefs.reduce((obj, item) => {
      obj[item.key] = item.value;
      return obj;
    }, {});

    if (!preferences.keywords || !preferences.location) {
      console.log('⚠️ Skipping hunt: Keywords or location not set in preferences.');
      return { message: 'Preferences not set.' };
    }

    console.log(`🔍 Hunting for "${preferences.keywords}" in "${preferences.location}"...`);

    // 2. Dynamically construct URLs
    const keywords = encodeURIComponent(preferences.keywords.replace(/,/g, ' ').replace(/\s+/g, ' ').trim());
    const location = encodeURIComponent(preferences.location.toLowerCase().trim());
    const town = encodeURIComponent(preferences.town.toLowerCase().trim());
    const radius = preferences.radius || '30'; // Default to 30 if not set

    // Refined URLs for each job board
    const cwjobsUrl = `https://www.cwjobs.co.uk/jobs/${keywords.replace(/%20/g, '-').toLowerCase()}/in-${town}?radius=${radius}`;
    const linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${location}`;
    const indeedUrl = `https://www.indeed.co.uk/jobs?q=${keywords}&l=${location}`;

    // 3. Instantiate Adapters
    const adapters = [
      new CWJobsAdapter({ 
        loginUrl: 'https://www.cwjobs.co.uk/account/signin', 
        searchUrl: cwjobsUrl, 
        email: process.env.CWJOBS_EMAIL, 
        password: process.env.CWJOBS_PASSWORD,
        keywords: preferences.keywords,
        location: preferences.location
      }),
      new LinkedInAdapter({ searchUrl: linkedinUrl, email: process.env.LINKEDIN_EMAIL, password: process.env.LINKEDIN_PASSWORD }),
      new IndeedAdapter({ searchUrl: indeedUrl }),
    ];

    // 4. Scrape for new jobs
    const stackKeywords = preferences.stack_keywords ? preferences.stack_keywords.split(',').map(k => k.trim().toLowerCase()) : [];
    const newJobs = await scraper.scrapeAndSave(knex, adapters, stackKeywords);

    if (newJobs.length === 0) {
      console.log('✅ Hunt complete. No new jobs found.');
      return { message: 'Hunt complete. No new jobs found.' };
    }

    console.log(`✨ Found ${newJobs.length} new potential jobs. Analyzing and matching...`);
    let opportunitiesFound = 0;

    // 5. Analyze and Match
    for (const job of newJobs) {
      const analyzedJob = await analyzer.analyzeAndSaveJob(knex, job);
      if (!analyzedJob.description) {
        console.warn(`Skipping match for ${job.title} - no description found.`);
        continue;
      }

      const matchResult = await matcher.matchJob(knex, analyzedJob);

      // 6. Save as Opportunity if it's a good match
      if (matchResult.match && matchResult.score > 0.6) { // Set a threshold for what constitutes an opportunity
        opportunitiesFound++;
        await knex('applications').insert({
          job_id: analyzedJob.id,
          status: 'opportunity', // New status for agent-found jobs
          applied_at: new Date().toISOString(),
          meta: JSON.stringify({
            note: 'Found by Proactive Hunter.',
            match_score: matchResult.score,
          }),
        });
      }
    }

    console.log(`✅ Hunt complete. Found ${opportunitiesFound} new high-match opportunities!`);
    return { message: `Hunt complete. Found ${opportunitiesFound} new opportunities.` };

  } catch (err) {
    console.error('❌ Error during proactive hunt:', err);
    throw err;
  } finally {
    // 7. Cleanup
    await analyzer.closeBrowser();
    await matcher.closeBrowser();
    console.log('🧹 Proactive hunt cleanup complete.');
  }
}

module.exports = { runProactiveHunt };
