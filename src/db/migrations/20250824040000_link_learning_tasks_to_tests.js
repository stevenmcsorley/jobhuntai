/**
 * Link learning tasks to test sessions and add test result tracking
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add test tracking fields to learning_tasks
  await knex.schema.table('learning_tasks', function(table) {
    table.integer('test_session_id').unsigned().nullable();
    table.boolean('test_completed').defaultTo(false);
    table.integer('test_score').nullable(); // Percentage score
    table.integer('test_duration_minutes').nullable(); // How long the test took
    table.timestamp('test_taken_at').nullable();
    
    table.foreign('test_session_id').references('id').inTable('test_sessions').onDelete('SET NULL');
    table.index(['skill_name', 'test_completed']);
  });

  // Add user_id to test_sessions if it doesn't exist
  const hasUserId = await knex.schema.hasColumn('test_sessions', 'user_id');
  if (!hasUserId) {
    await knex.schema.table('test_sessions', function(table) {
      table.integer('user_id').unsigned().nullable();
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.index(['user_id', 'skill']);
    });
  }

  console.log('Added test tracking fields to learning_tasks and test_sessions');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Remove fields from learning_tasks
  await knex.schema.table('learning_tasks', function(table) {
    table.dropForeign(['test_session_id']);
    table.dropColumn('test_session_id');
    table.dropColumn('test_completed');
    table.dropColumn('test_score');
    table.dropColumn('test_duration_minutes');
    table.dropColumn('test_taken_at');
  });

  // Remove user_id from test_sessions if we added it
  const hasUserId = await knex.schema.hasColumn('test_sessions', 'user_id');
  if (hasUserId) {
    await knex.schema.table('test_sessions', function(table) {
      table.dropForeign(['user_id']);
      table.dropColumn('user_id');
    });
  }

  console.log('Removed test tracking fields');
};