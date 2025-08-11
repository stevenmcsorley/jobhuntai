const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function dropUserIdColumns() {
  const tables = [
    'jobs', 'applications', 'preferences', 'interviews', 'application_notes',
    'test_sessions', 'guidance', 'profiles', 'skills', 'work_experiences',
    'experience_highlights', 'projects', 'project_highlights', 'education'
  ];

  for (const table of tables) {
    try {
      const tableExists = await knex.schema.hasTable(table);
      if (tableExists) {
        const columnExists = await knex.schema.hasColumn(table, 'user_id');
        if (columnExists) {
          console.log(`Dropping user_id from ${table}...`);
          await knex.schema.alterTable(table, function(t) {
            t.dropColumn('user_id');
          });
          console.log(`Successfully dropped user_id from ${table}.`);
        } else {
          console.log(`user_id column does not exist in ${table}. Skipping.`);
        }
      } else {
        console.log(`Table ${table} does not exist. Skipping.`);
      }
    } catch (err) {
      console.error(`Error dropping user_id from ${table}:`, err);
    }
  }
  knex.destroy();
}

dropUserIdColumns();
