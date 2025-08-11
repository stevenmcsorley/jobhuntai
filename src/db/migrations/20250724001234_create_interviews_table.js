/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('interviews', function(table) {
    table.increments('id').primary();
    table.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.datetime('interview_date').notNullable();
    table.string('interview_type').notNullable(); // e.g., 'Phone Screen', 'Technical', 'Behavioral'
    table.text('notes');
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('interviews');
};