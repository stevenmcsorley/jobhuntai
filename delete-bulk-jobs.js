// A script to delete only the jobs that were imported via the bulk-add feature.
const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function cleanupBulkJobs() {
  console.log('Starting cleanup of jobs with source "manual-bulk"...');
  try {
    const jobsToDelete = await knex('jobs')
      .where('source', 'manual-bulk')
      .select('id');

    if (jobsToDelete.length === 0) {
      console.log('No jobs with source "manual-bulk" found. Nothing to delete.');
      return;
    }

    const idsToDelete = jobsToDelete.map(j => j.id);
    console.log(`Found ${idsToDelete.length} bulk-imported jobs to delete.`);

    // Because of the 'onDelete("CASCADE")' constraint in the database schema,
    // deleting these jobs will automatically delete their associated applications and matches.
    const deletedCount = await knex('jobs')
      .whereIn('id', idsToDelete)
      .del();

    console.log(`Successfully deleted ${deletedCount} jobs and their related data.`);
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Ensure the database connection is closed
    await knex.destroy();
  }
}

cleanupBulkJobs();
