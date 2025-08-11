exports.up = function(knex) {
  return knex.schema.alterTable('applications', function(table) {
    table.unique('job_id');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('applications', function(table) {
    table.dropUnique('job_id');
  });
};