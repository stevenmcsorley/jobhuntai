exports.up = function(knex) {
  return knex.schema
    .createTable('profiles', function(table) {
      table.increments('id').primary();
      table.string('full_name');
      table.string('email');
      table.string('phone');
      table.string('linkedin_url');
      table.string('github_url');
      table.text('summary');
      table.timestamps(true, true);
    })
    .createTable('skills', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable().unique();
      table.string('category').notNullable();
    })
    .createTable('work_experiences', function(table) {
      table.increments('id').primary();
      table.string('company').notNullable();
      table.string('title').notNullable();
      table.string('start_date');
      table.string('end_date');
      table.string('location');
      table.timestamps(true, true);
    })
    .createTable('experience_highlights', function(table) {
      table.increments('id').primary();
      table.integer('experience_id').unsigned().references('id').inTable('work_experiences').onDelete('CASCADE');
      table.text('highlight_text').notNullable();
      table.string('keywords');
    })
    .createTable('projects', function(table) {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.string('url');
      table.timestamps(true, true);
    })
    .createTable('project_highlights', function(table) {
      table.increments('id').primary();
      table.integer('project_id').unsigned().references('id').inTable('projects').onDelete('CASCADE');
      table.text('highlight_text').notNullable();
      table.string('keywords');
    })
    .createTable('education', function(table) {
      table.increments('id').primary();
      table.string('institution').notNullable();
      table.string('degree');
      table.string('field_of_study');
      table.string('graduation_date');
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('education')
    .dropTableIfExists('project_highlights')
    .dropTableIfExists('projects')
    .dropTableIfExists('experience_highlights')
    .dropTableIfExists('work_experiences')
    .dropTableIfExists('skills')
    .dropTableIfExists('profiles');
};