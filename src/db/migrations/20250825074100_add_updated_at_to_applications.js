/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add updated_at to applications table (no default due to SQLite limitations)
  await knex.schema.table('applications', function(table) {
    table.timestamp('updated_at');
  });
  
  // Set updated_at for existing applications to match applied_at
  await knex.raw('UPDATE applications SET updated_at = applied_at WHERE updated_at IS NULL');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('applications', function(table) {
    table.dropColumn('updated_at');
  });
};