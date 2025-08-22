/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('matches', function(table) {
    table.text('missing_skills').defaultTo('[]');
    table.text('suggested_tests').defaultTo('[]');
    table.text('completed_tests').defaultTo('[]');
    table.text('key_insights').defaultTo('[]');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('matches', function(table) {
    table.dropColumn('missing_skills');
    table.dropColumn('suggested_tests');
    table.dropColumn('completed_tests');
    table.dropColumn('key_insights');
  });
};
