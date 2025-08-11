exports.up = function(knex) {
  return knex.schema.table('test_results', function(table) {
    table.json('options');
  });
};

exports.down = function(knex) {
  return knex.schema.table('test_results', function(table) {
    table.dropColumn('options');
  });
};