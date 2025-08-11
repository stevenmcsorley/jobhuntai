exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.text('tailored_cv');
  });
};

exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('tailored_cv');
  });
};