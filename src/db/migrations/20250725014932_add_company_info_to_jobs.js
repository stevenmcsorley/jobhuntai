exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.text('company_info');
  });
};

exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('company_info');
  });
};