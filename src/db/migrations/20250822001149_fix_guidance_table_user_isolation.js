/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // For SQLite, we need to recreate the table to change the unique constraint
  // and add user_id field
  
  // First, create a temporary table with the new structure
  await knex.schema.createTable('guidance_temp', function(table) {
    table.increments('id').primary();
    table.string('skill').notNullable();
    table.text('guidance_text').notNullable();
    table.text('source_result_ids').notNullable(); // JSON array of test_results.id
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.unique(['skill', 'user_id']); // Composite unique constraint
    table.index('user_id');
    table.timestamps(true, true);
  });
  
  // Copy existing data to the temporary table with user_id = 1 (default user)
  const existingGuidance = await knex('guidance').select('*');
  if (existingGuidance.length > 0) {
    const guidanceWithUserId = existingGuidance.map(g => ({
      ...g,
      user_id: 1 // Assign to default user
    }));
    await knex('guidance_temp').insert(guidanceWithUserId);
  }
  
  // Drop the original table
  await knex.schema.dropTable('guidance');
  
  // Rename the temporary table to the original name
  await knex.schema.renameTable('guidance_temp', 'guidance');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Recreate the original table structure
  await knex.schema.createTable('guidance_temp', function(table) {
    table.increments('id').primary();
    table.string('skill').notNullable().unique();
    table.text('guidance_text').notNullable();
    table.text('source_result_ids').notNullable();
    table.timestamps(true, true);
  });
  
  // Copy existing data to the temporary table (removing user_id)
  const existingGuidance = await knex('guidance').select('id', 'skill', 'guidance_text', 'source_result_ids', 'created_at', 'updated_at');
  if (existingGuidance.length > 0) {
    await knex('guidance_temp').insert(existingGuidance);
  }
  
  // Drop the current table
  await knex.schema.dropTable('guidance');
  
  // Rename the temporary table to the original name
  await knex.schema.renameTable('guidance_temp', 'guidance');
};