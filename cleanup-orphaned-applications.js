const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function cleanupOrphanedApplications() {
  try {
    console.log('Starting cleanup of orphaned application records...');

    // Get all job IDs from the jobs table
    const existingJobIds = (await knex('jobs').select('id')).map(row => row.id);
    const existingJobIdSet = new Set(existingJobIds);

    // Get all application records
    const allApplications = await knex('applications').select('id', 'job_id');

    // Filter for applications whose job_id does not exist in the jobs table
    const orphanedApplications = allApplications.filter(app => !existingJobIdSet.has(app.job_id));

    if (orphanedApplications.length === 0) {
      console.log('No orphaned application records found. Exiting.');
      return;
    }

    console.log(`Found ${orphanedApplications.length} orphaned application(s):`);
    orphanedApplications.forEach(app => {
      console.log(`  Application ID: ${app.id}, Orphaned Job ID: ${app.job_id}`);
    });

    const orphanedIds = orphanedApplications.map(app => app.id);

    // Delete the orphaned application records
    const deletedCount = await knex('applications')
      .whereIn('id', orphanedIds)
      .del();

    console.log(`Successfully deleted ${deletedCount} orphaned application record(s).`);

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    knex.destroy();
  }
}

cleanupOrphanedApplications();
