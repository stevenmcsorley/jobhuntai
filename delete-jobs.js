const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function deleteLastThreeJobs() {
  console.log('Connecting to the database to delete the last 3 jobs...');
  try {
    const jobsToDelete = await knex('jobs')
      .select('id')
      .orderBy('id', 'desc')
      .limit(3);

    if (jobsToDelete.length === 0) {
      console.log('No jobs found to delete.');
      return;
    }

    const idsToDelete = jobsToDelete.map(job => job.id);
    console.log(`Found job IDs to delete: ${idsToDelete.join(', ')}`);

    const deletedCount = await knex('jobs')
      .whereIn('id', idsToDelete)
      .del();

    console.log(`Successfully deleted ${deletedCount} job(s).`);

  } catch (error) {
    console.error('Error deleting jobs:', error);
  } finally {
    await knex.destroy();
    console.log('Database connection closed.');
  }
}

deleteLastThreeJobs();
