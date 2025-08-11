exports.up = function(knex) {
  return knex.schema.table('preferences', function(table) {
    table.text('stack_keywords');
  });
};

exports.down = function(knex) {
  return knex.schema.table('preferences', function(table) {
    table.dropColumn('stack_keywords');
  });
};