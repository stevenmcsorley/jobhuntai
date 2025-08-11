exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.string('salary');
  });
};

exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('salary');
  });
};