/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // For SQLite, we need to recreate the table to remove the unique constraint
  // and add a composite unique constraint on (name, user_id)
  
  // First, create a temporary table with the new structure
  await knex.schema.createTable('skills_temp', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('category').notNullable();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
    table.unique(['name', 'user_id']); // Composite unique constraint
  });
  
  // Copy existing data to the temporary table
  await knex.raw(`
    INSERT INTO skills_temp (id, name, category, user_id)
    SELECT id, name, category, user_id FROM skills
  `);
  
  // Drop the original table
  await knex.schema.dropTable('skills');
  
  // Rename the temporary table to the original name
  await knex.schema.renameTable('skills_temp', 'skills');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Recreate the original table structure with the global unique constraint
  await knex.schema.createTable('skills_temp', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.string('category').notNullable();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  // Copy existing data to the temporary table
  await knex.raw(`
    INSERT INTO skills_temp (id, name, category, user_id)
    SELECT id, name, category, user_id FROM skills
  `);
  
  // Drop the current table
  await knex.schema.dropTable('skills');
  
  // Rename the temporary table to the original name
  await knex.schema.renameTable('skills_temp', 'skills');
};