exports.up = async function(knex) {
  // Create a default user if one doesn't exist
  let defaultUser = await knex('users').where({ username: 'default_user' }).first();
  let userId;
  if (defaultUser) {
    userId = defaultUser.id;
  } else {
    const [newUserId] = await knex('users').insert({
      username: 'default_user',
      password_hash: 'temp_password_hash' // This should be a proper hash in a real app
    }).returning('id');
    userId = newUserId.id;
  }

  // Assign user_id to existing records where it's null
  await knex('jobs').update({ user_id: userId }).whereNull('user_id');
  await knex('applications').update({ user_id: userId }).whereNull('user_id');
  await knex('preferences').update({ user_id: userId }).whereNull('user_id');
  await knex('interviews').update({ user_id: userId }).whereNull('user_id');
  await knex('application_notes').update({ user_id: userId }).whereNull('user_id');
  await knex('test_sessions').update({ user_id: userId }).whereNull('user_id');
  await knex('guidance').update({ user_id: userId }).whereNull('user_id');
  await knex('profiles').update({ user_id: userId }).whereNull('user_id');
  await knex('skills').update({ user_id: userId }).whereNull('user_id');
  await knex('work_experiences').update({ user_id: userId }).whereNull('user_id');
  await knex('experience_highlights').update({ user_id: userId }).whereNull('user_id');
  await knex('projects').update({ user_id: userId }).whereNull('user_id');
  await knex('project_highlights').update({ user_id: userId }).whereNull('user_id');
  await knex('education').update({ user_id: userId }).whereNull('user_id');
  await knex('matches').update({ user_id: userId }).whereNull('user_id');
  await knex('cvs').update({ user_id: userId }).whereNull('user_id');

  // Make user_id not nullable after assigning existing records
  await knex.schema.alterTable('jobs', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('applications', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('preferences', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('interviews', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('application_notes', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('test_sessions', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('guidance', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('profiles', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('skills', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('work_experiences', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('experience_highlights', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('projects', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('project_highlights', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('education', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('matches', function(table) {
    table.integer('user_id').notNullable().alter();
  });
  await knex.schema.alterTable('cvs', function(table) {
    table.integer('user_id').notNullable().alter();
  });
};

exports.down = async function(knex) {
  // Revert user_id columns to nullable (or drop them if desired for full rollback)
  await knex.schema.alterTable('jobs', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('applications', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('preferences', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('interviews', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('application_notes', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('test_sessions', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('guidance', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('profiles', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('skills', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('work_experiences', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('experience_highlights', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('projects', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('project_highlights', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('education', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('matches', function(table) {
    table.integer('user_id').nullable().alter();
  });
  await knex.schema.alterTable('cvs', function(table) {
    table.integer('user_id').nullable().alter();
  });
};

exports.down = async function(knex) {
  // Revert user_id columns to nullable (or drop them if desired for full rollback)
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