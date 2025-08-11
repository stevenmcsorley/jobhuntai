const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function createMissingApplications() {
  try {
    console.log('Starting creation of missing application records...');

    // Find jobs that do not have an associated application record
    const jobsWithoutApps = await knex('jobs')
      .leftJoin('applications', 'jobs.id', 'applications.job_id')
      .whereNull('applications.id')
      .select('jobs.id as job_id', 'jobs.title');

    if (jobsWithoutApps.length === 0) {
      console.log('No jobs found without associated application records. Exiting.');
      return;
    }

    console.log(`Found ${jobsWithoutApps.length} job(s) without application records:`);
    jobsWithoutApps.forEach(job => {
      console.log(`  Job ID: ${job.job_id}, Title: ${job.title}`);
    });

    let createdCount = 0;
    for (const job of jobsWithoutApps) {
      try {
        await knex('applications').insert({
          job_id: job.job_id,
          status: 'opportunity',
          applied_at: new Date().toISOString(),
          meta: JSON.stringify({ note: 'Auto-generated opportunity from existing job.' })
        });
        createdCount++;
      } catch (err) {
        console.error(`  Failed to create application for job ID ${job.job_id}:`, err.message);
      }
    }

    console.log(`Successfully created ${createdCount} new application record(s).`);

  } catch (err) {
    console.error('Error during application creation:', err);
  } finally {
    knex.destroy();
  }
}

createMissingApplications();
