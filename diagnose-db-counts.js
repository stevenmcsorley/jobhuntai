const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function diagnoseCounts() {
  try {
    console.log('Diagnosing job and application counts...');

    const jobs = await knex('jobs').select('id');
    const applications = await knex('applications').select('id', 'job_id');

    const jobIds = new Set(jobs.map(job => job.id));
    const applicationJobIds = applications.map(app => app.job_id);

    console.log(`Total jobs in 'jobs' table: ${jobs.length}`);
    console.log(`Total applications in 'applications' table: ${applications.length}`);

    let orphanedApplicationsCount = 0;
    const jobIdsInApplications = new Set();
    const duplicateApplicationJobIds = {};

    applications.forEach(app => {
      if (!jobIds.has(app.job_id)) {
        orphanedApplicationsCount++;
        console.log(`  Orphaned application found: app.id=${app.id}, app.job_id=${app.job_id}`);
      }

      if (jobIdsInApplications.has(app.job_id)) {
        duplicateApplicationJobIds[app.job_id] = (duplicateApplicationJobIds[app.job_id] || 1) + 1;
      } else {
        jobIdsInApplications.add(app.job_id);
      }
    });

    console.log(`Applications referencing non-existent jobs: ${orphanedApplicationsCount}`);

    const jobsWithMultipleApplications = Object.entries(duplicateApplicationJobIds).filter(([, count]) => count > 1);
    if (jobsWithMultipleApplications.length > 0) {
      console.log('Jobs with multiple application entries:');
      jobsWithMultipleApplications.forEach(([jobId, count]) => {
        console.log(`  Job ID: ${jobId}, Applications: ${count}`);
      });
    } else {
      console.log('No jobs with multiple application entries found.');
    }

    console.log('Diagnosis complete.');

  } catch (err) {
    console.error('Error during diagnosis:', err);
  } finally {
    knex.destroy();
  }
}

diagnoseCounts();
