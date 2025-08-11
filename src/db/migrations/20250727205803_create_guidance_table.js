/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('guidance', function(table) {
    table.increments('id').primary();
    table.string('skill').notNullable().unique();
    table.text('guidance_text').notNullable();
    table.text('source_result_ids').notNullable(); // JSON array of test_results.id
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('guidance');
};