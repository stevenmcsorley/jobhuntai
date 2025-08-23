exports.up = function(knex) {
  return knex.schema.createTable('skill_recommendations', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.json('recommendations').notNullable(); // Store array of recommended skills
    table.text('profile_summary').nullable(); // Store profile summary used for generation
    table.timestamp('generated_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at').nullable(); // When recommendations should be regenerated
    table.boolean('is_active').defaultTo(true);
    
    // Foreign key constraint
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    
    // Index for faster lookups
    table.index('user_id');
    table.index(['user_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('skill_recommendations');
};