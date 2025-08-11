exports.up = function(knex) {
  return knex.schema.alterTable('preferences', function(table) {
    table.unique(['key', 'user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('preferences', function(table) {
    table.dropUnique(['key', 'user_id']);
  });
};