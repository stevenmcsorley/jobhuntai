exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.string('posted');
  });
};

exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('posted');
  });
};