/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('jobs', function (table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('company').notNullable();
      table.string('location');
      table.string('url').unique().notNullable();
      table.datetime('scraped_at').notNullable();
      table.string('source').notNullable();
    })
    .createTable('matches', function (table) {
      table.increments('id').primary();
      table.integer('job_id').unsigned().notNullable().references('id').inTable('jobs').onDelete('CASCADE');
      table.boolean('match').notNullable();
      table.float('score');
      table.text('reasons'); // JSON-stringified array
      table.datetime('checked_at').notNullable();
    })
    .createTable('applications', function (table) {
      table.increments('id').primary();
      table.integer('job_id').unsigned().notNullable().references('id').inTable('jobs').onDelete('CASCADE');
      table.string('status').notNullable(); // e.g., 'applied', 'external', 'followup', 'rejected'
      table.datetime('applied_at');
      table.text('meta'); // JSON metadata
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTable('applications')
    .dropTable('matches')
    .dropTable('jobs');
};