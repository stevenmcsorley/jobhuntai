const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function diagnoseDbState() {
  try {
    console.log("--- Database State Diagnosis ---");

    const usersTableExists = await knex.schema.hasTable("users");
    console.log(`Table 'users' exists: ${usersTableExists}`);

    const jobsTableExists = await knex.schema.hasTable("jobs");
    if (jobsTableExists) {
      const userIdInJobs = await knex.schema.hasColumn("jobs", "user_id");
      console.log(`Column 'user_id' in 'jobs' table exists: ${userIdInJobs}`);
    }

    const applicationsTableExists = await knex.schema.hasTable("applications");
    if (applicationsTableExists) {
      const userIdInApplications = await knex.schema.hasColumn("applications", "user_id");
      console.log(`Column 'user_id' in 'applications' table exists: ${userIdInApplications}`);
    }

    console.log("\n--- Knex Migrations History ---");
    const migrationsTableExists = await knex.schema.hasTable("knex_migrations");
    if (migrationsTableExists) {
      const migrations = await knex("knex_migrations").select('name').orderBy('migration_time', 'asc');
      console.log("Migrations recorded as run:");
      if (migrations.length === 0) {
        console.log("  (None)");
      } else {
        migrations.forEach(m => console.log(`  - ${m.name}`));
      }
    } else {
      console.log("Table 'knex_migrations' does not exist.");
    }

  } catch (err) {
    console.error("Error during database diagnosis:", err);
  } finally {
    knex.destroy();
  }
}

diagnoseDbState();
