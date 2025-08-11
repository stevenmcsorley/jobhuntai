exports.up = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.string('apply_button_text');
  });
};

exports.down = function(knex) {
  return knex.schema.table('jobs', function(table) {
    table.dropColumn('apply_button_text');
  });
};