exports.up = function(knex) {
  return knex.schema
    .createTable('jobs', function(table) {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('company').notNullable();
      table.string('location');
      table.string('url').notNullable().unique();
      table.text('description');
      table.string('source');
      table.datetime('scraped_at').defaultTo(knex.fn.now());
      table.text('interview_prep');
      table.text('cover_letter');
      table.string('posted');
      table.string('salary');
      table.text('company_info');
      table.text('tailored_cv');
      table.string('apply_button_text');
      table.json('skills');
    })
    .createTable('applications', function(table) {
      table.increments('id').primary();
      table.integer('job_id').unsigned().references('id').inTable('jobs').onDelete('CASCADE');
      table.string('status').defaultTo('pending');
      table.datetime('applied_at').defaultTo(knex.fn.now());
      table.json('meta');
      table.text('notes');
      table.unique(['job_id']);
    })
    .createTable('interviews', function(table) {
      table.increments('id').primary();
      table.integer('application_id').unsigned().references('id').inTable('applications').onDelete('CASCADE');
      table.datetime('interview_date').notNullable();
      table.string('interview_type').notNullable();
      table.text('notes');
    })
    .createTable('preferences', function(table) {
      table.string('key').notNullable();
      table.text('value');
    })
    .createTable('application_notes', function(table) {
      table.increments('id').primary();
      table.integer('application_id').unsigned().references('id').inTable('applications').onDelete('CASCADE');
      table.text('note').notNullable();
      table.datetime('created_at').defaultTo(knex.fn.now());
    })
    .createTable('test_sessions', function(table) {
      table.increments('id').primary();
      table.string('skill').notNullable();
      table.string('difficulty').notNullable();
      table.string('type').notNullable();
      table.float('score');
      table.datetime('completed_at').defaultTo(knex.fn.now());
    })
    .createTable('test_results', function(table) {
      table.increments('id').primary();
      table.integer('session_id').unsigned().references('id').inTable('test_sessions').onDelete('CASCADE');
      table.text('question_text').notNullable();
      table.text('correct_answer').notNullable();
      table.text('user_answer');
      table.text('feedback');
      table.boolean('is_correct');
      table.json('options');
    })
    .createTable('guidance', function(table) {
      table.increments('id').primary();
      table.string('skill').notNullable();
      table.text('guidance_text').notNullable();
      table.json('source_result_ids');
    })
    .createTable('matches', function(table) {
      table.increments('id').primary();
      table.integer('job_id').unsigned().references('id').inTable('jobs').onDelete('CASCADE');
      table.boolean('match').notNullable();
      table.float('score');
      table.json('reasons');
      table.datetime('checked_at').defaultTo(knex.fn.now());
    })
    .createTable('cvs', function(table) {
      table.increments('id').primary();
      table.text('cv_content').notNullable();
      table.datetime('uploaded_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('cvs')
    .dropTableIfExists('matches')
    .dropTableIfExists('guidance')
    .dropTableIfExists('test_results')
    .dropTableIfExists('test_sessions')
    .dropTableIfExists('application_notes')
    .dropTableIfExists('preferences')
    .dropTableIfExists('interviews')
    .dropTableIfExists('applications')
    .dropTableIfExists('jobs');
};