exports.up = function(knex) {
  return knex.schema.alterTable('cvs', function(table) {
    table.unique(['user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('cvs', function(table) {
    table.dropUnique(['user_id']);
  });
};