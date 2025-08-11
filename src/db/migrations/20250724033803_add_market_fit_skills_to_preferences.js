exports.up = function(knex) {
  return knex.schema.table('preferences', function(table) {
    table.text('market_fit_skills');
  });
};

exports.down = function(knex) {
  return knex.schema.table('preferences', function(table) {
    table.dropColumn('market_fit_skills');
  });
};