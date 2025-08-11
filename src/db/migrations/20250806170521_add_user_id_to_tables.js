exports.up = async function(knex) {
  await knex.schema.alterTable('jobs', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('applications', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('preferences', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('interviews', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('application_notes', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('test_sessions', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('guidance', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('profiles', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('skills', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('work_experiences', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('experience_highlights', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('projects', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('project_highlights', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('education', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('matches', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
  await knex.schema.alterTable('cvs', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable();
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('jobs', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('applications', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('preferences', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('interviews', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('application_notes', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('test_sessions', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('guidance', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('profiles', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('skills', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('work_experiences', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('experience_highlights', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('projects', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('project_highlights', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('education', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('matches', function(table) {
    table.dropColumn('user_id');
  });
  await knex.schema.alterTable('cvs', function(table) {
    table.dropColumn('user_id');
  });
};