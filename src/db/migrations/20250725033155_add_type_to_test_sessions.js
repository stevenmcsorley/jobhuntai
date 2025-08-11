exports.up = function(knex) {
  return knex.schema.table('test_sessions', function(table) {
    table.string('type').defaultTo('short_answer');
  });
};

exports.down = function(knex) {
  return knex.schema.table('test_sessions', function(table) {
    table.dropColumn('type');
  });
};