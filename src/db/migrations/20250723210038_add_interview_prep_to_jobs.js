/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.text('interview_prep'); // To store JSON-stringified interview prep data
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('interview_prep');
  });
};