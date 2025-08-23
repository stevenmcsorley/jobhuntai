exports.up = function(knex) {
  return knex.schema.createTable('cv_analysis_cache', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.string('cache_key').notNullable().comment('Unique cache key for the analysis request');
    table.string('analysis_type').notNullable().comment('Type of cached analysis');
    
    // Cached data
    table.json('cached_result').notNullable().comment('Cached analysis result');
    table.text('input_data_hash').comment('Hash of input data for cache invalidation');
    
    // Cache metadata
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').notNullable().comment('When cache expires');
    table.integer('hit_count').default(0).comment('Number of times this cache was used');
    table.timestamp('last_accessed_at').defaultTo(knex.fn.now());
    
    // Foreign keys
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Indexes
    table.unique(['cache_key']);
    table.index(['user_id', 'analysis_type']);
    table.index(['expires_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cv_analysis_cache');
};