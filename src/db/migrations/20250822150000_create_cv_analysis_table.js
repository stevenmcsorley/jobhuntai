exports.up = function(knex) {
  return knex.schema.createTable('cv_analysis', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.integer('cv_version').notNullable();
    table.string('content_hash').notNullable().comment('SHA-256 hash of analyzed content');
    table.string('analysis_type').notNullable().default('general').comment('Type of analysis: general, job-specific, comparison');
    
    // Analysis results - stored as JSON
    table.json('analysis_results').notNullable().comment('Complete AI analysis results');
    table.integer('overall_score').unsigned().comment('Overall CV score 0-100');
    table.integer('ats_score').unsigned().comment('ATS compatibility score 0-100');
    
    // Metadata
    table.text('content_preview').comment('First 500 chars of analyzed content');
    table.string('ai_model_used').comment('AI model used for analysis');
    table.integer('analysis_duration_ms').comment('Time taken for analysis in milliseconds');
    
    // Change tracking
    table.boolean('is_latest').default(false).comment('Whether this is the latest analysis for the user');
    table.timestamp('analyzed_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').comment('When this analysis should be considered stale');
    
    // Foreign keys
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Indexes for efficient queries
    table.index(['user_id', 'is_latest']);
    table.index(['user_id', 'cv_version']);
    table.index(['content_hash']);
    table.index(['analyzed_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cv_analysis');
};