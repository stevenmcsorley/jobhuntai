exports.up = function(knex) {
  return knex.schema
    .createTable('test_sessions', function (table) {
      table.increments('id').primary();
      table.string('skill').notNullable();
      table.string('difficulty').notNullable();
      table.float('score');
      table.datetime('completed_at').notNullable();
    })
    .createTable('test_results', function (table) {
      table.increments('id').primary();
      table.integer('session_id').unsigned().notNullable().references('id').inTable('test_sessions').onDelete('CASCADE');
      table.text('question_text').notNullable();
      table.text('user_answer');
      table.text('correct_answer');
      table.text('feedback');
      table.boolean('is_correct');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('test_results')
    .dropTable('test_sessions');
};