const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function cleanupDuplicateApplications() {
  try {
    console.log('Starting cleanup of duplicate application records...');

    const duplicateJobIds = await knex('applications')
      .select('job_id')
      .count('id as count')
      .groupBy('job_id')
      .having('count', '>', 1);

    if (duplicateJobIds.length === 0) {
      console.log('No duplicate application records found. Exiting.');
      return;
    }

    console.log(`Found ${duplicateJobIds.length} job(s) with duplicate application entries.`);

    let totalDeleted = 0;

    for (const { job_id } of duplicateJobIds) {
      const applicationsForJob = await knex('applications')
        .where({ job_id })
        .orderBy('applied_at', 'asc') // Keep the oldest application
        .select('id');

      // Keep the first (oldest) application, delete the rest
      const idsToDelete = applicationsForJob.slice(1).map(app => app.id);

      if (idsToDelete.length > 0) {
        const deletedCount = await knex('applications')
          .whereIn('id', idsToDelete)
          .del();
        totalDeleted += deletedCount;
        console.log(`  Deleted ${deletedCount} duplicate application(s) for job_id: ${job_id}`);
      }
    }

    console.log(`Cleanup complete. Total duplicate application records deleted: ${totalDeleted}.`);

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    knex.destroy();
  }
}

cleanupDuplicateApplications();
