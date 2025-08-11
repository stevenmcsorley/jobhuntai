const knex = require('knex')(require('./knexfile').development);

async function clearApplications() {
  console.log('🔥 Deleting all records from the "applications" table...');
  try {
    const deletedCount = await knex('applications').del();
    console.log(`✅ Successfully deleted ${deletedCount} application record(s).`);
    
    // Also reset the auto-increment counter for the table
    await knex.raw('DELETE FROM sqlite_sequence WHERE name="applications";');
    console.log('🔄 Auto-increment counter for "applications" has been reset.');

  } catch (err) {
    console.error('❌ An error occurred while clearing the applications table:', err);
  } finally {
    await knex.destroy();
  }
}

clearApplications();
