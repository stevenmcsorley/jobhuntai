const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  try {
    // Delete jobs with null or 'Untitled Job' titles
    const deletedJobs = await knex('jobs')
      .whereNull('title')
      .orWhere('title', '=', 'Untitled Job')
      .del();
    console.log(`- Deleted ${deletedJobs} job(s) with no title.`);

    // Delete applications with no applied_at date
    const deletedApplications = await knex('applications')
      .whereNull('applied_at')
      .del();
    console.log(`- Deleted ${deletedApplications} application(s) with no date.`);

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await knex.destroy();
    console.log('\n✅ Cleanup complete. Database connection closed.');
  }
}

cleanupDatabase();
