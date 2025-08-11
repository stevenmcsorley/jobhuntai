const knex = require('knex')(require('./knexfile').development);

async function inspectDatabase() {
  console.log('🔍 Inspecting the database...');
  try {
    const totalJobs = await knex('jobs').count('id as count').first();
    const totalApplications = await knex('applications').count('id as count').first();

    const orphanedJobs = await knex('jobs')
      .leftJoin('applications', 'jobs.id', 'applications.job_id')
      .whereNull('applications.id')
      .count('jobs.id as count')
      .first();

    console.log('--- Database Report ---');
    console.log(`📊 Total jobs in 'jobs' table: ${totalJobs.count}`);
    console.log(`📊 Total entries in 'applications' table: ${totalApplications.count}`);
    console.log(`👻 Orphaned jobs (no link in 'applications' table): ${orphanedJobs.count}`);
    console.log('-----------------------');

  } catch (err) {
    console.error('❌ An error occurred during database inspection:', err);
  } finally {
    await knex.destroy();
  }
}

inspectDatabase();
