exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.json('skills');
  });
};

exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('skills');
  });
};