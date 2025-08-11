exports.up = function(knex) {
  return knex.schema.createTable('application_notes', function(table) {
    table.increments('id').primary();
    table.integer('application_id').unsigned().notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.text('note').notNullable();
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('application_notes');
};