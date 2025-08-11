const knex = require('knex')(require('./knexfile').development);

async function cleanupOrphanedJobs() {
  console.log('Starting cleanup of orphaned jobs...');

  try {
    // Find the 10 most recent jobs
    const recentJobs = await knex('jobs')
      .orderBy('id', 'desc')
      .limit(10)
      .select('id');

    if (recentJobs.length === 0) {
      console.log('No recent jobs found to clean up.');
      return;
    }

    const jobIds = recentJobs.map(j => j.id);

    // Find which of these have no corresponding application record
    const linkedApplications = await knex('applications')
      .whereIn('job_id', jobIds)
      .select('job_id');

    const linkedJobIds = new Set(linkedApplications.map(a => a.job_id));

    const orphanedJobIds = jobIds.filter(id => !linkedJobIds.has(id));

    if (orphanedJobIds.length === 0) {
      console.log('No orphaned jobs found among the last 10 entries.');
      return;
    }

    console.log(`Found ${orphanedJobIds.length} orphaned job(s) to delete.`);

    // Delete the orphaned jobs
    const deletedCount = await knex('jobs')
      .whereIn('id', orphanedJobIds)
      .del();

    console.log(`✅ Successfully deleted ${deletedCount} orphaned job(s).`);

  } catch (err) {
    console.error('❌ An error occurred during cleanup:', err);
  } finally {
    await knex.destroy();
  }
}

cleanupOrphanedJobs();
