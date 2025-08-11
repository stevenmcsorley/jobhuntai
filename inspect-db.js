const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function inspectDatabase() {
  console.log('🔍 Inspecting the database...');
  try {
    console.log('\n--- Last 10 Jobs ---');
    const jobs = await knex('jobs').select('*').orderBy('id', 'desc').limit(10);
    console.table(jobs);

    console.log('\n--- Last 10 Applications ---');
    const applications = await knex('applications').select('*').orderBy('id', 'desc').limit(10);
    console.table(applications);

  } catch (error) {
    console.error('❌ Error inspecting database:', error);
  } finally {
    await knex.destroy();
    console.log('\n✅ Inspection complete. Database connection closed.');
  }
}

inspectDatabase();
