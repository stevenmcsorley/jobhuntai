exports.up = function(knex) {
  return knex.schema.alterTable('skills', function(table) {
    // Drop the existing unique constraint on 'name' if it exists
    table.dropUnique(['name']);
    // Add a composite unique constraint on 'name' and 'user_id'
    table.unique(['name', 'user_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('skills', function(table) {
    // Drop the composite unique constraint
    table.dropUnique(['name', 'user_id']);
    // Re-add the unique constraint on 'name' (if desired for rollback)
    table.unique(['name']);
  });
};