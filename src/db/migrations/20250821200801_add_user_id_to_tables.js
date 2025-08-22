/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add user_id to job management tables
  await knex.schema.table('jobs', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('applications', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('matches', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  // Profile and CV tables
  await knex.schema.table('profiles', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('skills', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('work_experiences', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('projects', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('education', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  // Add index to existing cvs user_id column
  await knex.schema.raw('CREATE INDEX idx_cvs_user_id ON cvs(user_id)');
  
  // Testing and learning tables
  await knex.schema.table('test_sessions', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  await knex.schema.table('guidance', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  // Configuration tables
  await knex.schema.table('preferences', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const tables = ['jobs', 'applications', 'matches', 'profiles', 'skills', 'work_experiences', 'projects', 'education', 'test_sessions', 'guidance', 'preferences'];
  
  for (const tableName of tables) {
    await knex.schema.table(tableName, function(table) {
      table.dropColumn('user_id');
    });
  }
  
  await knex.schema.raw('DROP INDEX IF EXISTS idx_cvs_user_id');
};