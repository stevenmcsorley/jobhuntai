// A script to delete only the test-related data.
const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function cleanupTestData() {
  console.log('Starting cleanup of all test data...');
  try {
    // Deleting from 'test_sessions' will cascade and delete all related 'test_results'.
    const deletedCount = await knex('test_sessions').del();

    console.log(`Successfully deleted ${deletedCount} test sessions and their related results.`);
    console.log('Test data cleanup complete.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Ensure the database connection is closed
    await knex.destroy();
  }
}

cleanupTestData();
