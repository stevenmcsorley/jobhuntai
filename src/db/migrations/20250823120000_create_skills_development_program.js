/**
 * Skills Development Program - Weekly learning plans and progress tracking
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Development programs - overall learning tracks
  await knex.schema.createTable('development_programs', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('title', 255).notNullable(); // "Frontend Mastery Track", "Full Stack Bootcamp"
    table.text('description');
    table.enum('status', ['active', 'completed', 'paused']).defaultTo('active');
    table.date('start_date').notNullable();
    table.date('target_end_date'); // When user wants to complete by
    table.integer('weeks_duration').defaultTo(12); // Default 3-month program
    table.json('skills_focus').comment('Array of skill names this program focuses on');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.index(['user_id', 'status']);
  });

  // Weekly learning plans within programs
  await knex.schema.createTable('weekly_plans', function(table) {
    table.increments('id').primary();
    table.integer('program_id').unsigned().notNullable();
    table.integer('week_number').notNullable(); // Week 1, 2, 3, etc.
    table.string('theme', 255).notNullable(); // "React Fundamentals", "TypeScript Deep Dive"
    table.date('start_date').notNullable();
    table.date('end_date').notNullable();
    table.enum('status', ['upcoming', 'current', 'completed', 'skipped']).defaultTo('upcoming');
    table.text('objectives').comment('Learning objectives for this week');
    table.integer('estimated_hours').defaultTo(10); // Hours per week
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('program_id').references('id').inTable('development_programs').onDelete('CASCADE');
    table.unique(['program_id', 'week_number']);
    table.index(['program_id', 'status']);
  });

  // Daily learning tasks within weekly plans
  await knex.schema.createTable('learning_tasks', function(table) {
    table.increments('id').primary();
    table.integer('weekly_plan_id').unsigned().notNullable();
    table.string('skill_name', 100).notNullable(); // Links to skills table
    table.enum('task_type', ['study', 'practice', 'test', 'project', 'review']).notNullable();
    table.string('title', 255).notNullable();
    table.text('description');
    table.text('resources').comment('URLs, book chapters, video links');
    table.integer('estimated_minutes').defaultTo(60);
    table.enum('priority', ['high', 'medium', 'low']).defaultTo('medium');
    table.enum('difficulty', ['beginner', 'intermediate', 'advanced']).defaultTo('intermediate');
    table.date('scheduled_date').notNullable();
    table.enum('status', ['pending', 'in_progress', 'completed', 'skipped']).defaultTo('pending');
    table.integer('actual_minutes'); // Time actually spent
    table.text('notes'); // User notes after completion
    table.integer('satisfaction_rating'); // 1-5 how useful was this task
    table.timestamp('started_at');
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('weekly_plan_id').references('id').inTable('weekly_plans').onDelete('CASCADE');
    table.index(['weekly_plan_id', 'scheduled_date']);
    table.index(['skill_name', 'status']);
    table.index(['scheduled_date', 'status']);
  });

  // Link tasks to skill tests for validation
  await knex.schema.createTable('task_test_links', function(table) {
    table.increments('id').primary();
    table.integer('learning_task_id').unsigned().notNullable();
    table.integer('test_session_id').unsigned(); // Links to existing test_sessions
    table.enum('test_status', ['required', 'recommended', 'completed', 'passed', 'failed']);
    table.integer('required_score').defaultTo(70); // Minimum score to "pass" this skill
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('learning_task_id').references('id').inTable('learning_tasks').onDelete('CASCADE');
    // test_sessions foreign key will be added when we confirm table name
    table.index(['learning_task_id']);
  });

  // Progress tracking and analytics
  await knex.schema.createTable('development_progress', function(table) {
    table.increments('id').primary();
    table.integer('program_id').unsigned().notNullable();
    table.string('skill_name', 100).notNullable();
    table.integer('total_tasks').defaultTo(0);
    table.integer('completed_tasks').defaultTo(0);
    table.integer('total_study_minutes').defaultTo(0);
    table.integer('actual_study_minutes').defaultTo(0);
    table.integer('tests_taken').defaultTo(0);
    table.integer('tests_passed').defaultTo(0);
    table.integer('average_test_score').defaultTo(0);
    table.decimal('completion_percentage', 5, 2).defaultTo(0);
    table.enum('proficiency_level', ['beginner', 'intermediate', 'advanced']).defaultTo('beginner');
    table.date('last_activity_date');
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.foreign('program_id').references('id').inTable('development_programs').onDelete('CASCADE');
    table.unique(['program_id', 'skill_name']);
    table.index(['program_id', 'proficiency_level']);
  });

  console.log('Created skills development program tables');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('development_progress');
  await knex.schema.dropTableIfExists('task_test_links');
  await knex.schema.dropTableIfExists('learning_tasks');
  await knex.schema.dropTableIfExists('weekly_plans');
  await knex.schema.dropTableIfExists('development_programs');
  
  console.log('Dropped skills development program tables');
};