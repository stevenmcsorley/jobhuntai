/**
 * Add CV versioning system for accurate job matching audit trails
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add versioning columns to CVs table
  await knex.schema.alterTable('cvs', function(table) {
    table.integer('version').defaultTo(1);
    table.boolean('is_current').defaultTo(true);
    table.enu('source', ['editor', 'master_profile', 'upload']).defaultTo('editor');
    table.text('change_summary');
  });

  // Add CV tracking to matches table
  await knex.schema.alterTable('matches', function(table) {
    table.integer('cv_version');
    table.text('cv_content_snapshot');
  });

  // Create index for performance
  await knex.schema.raw('CREATE INDEX idx_cvs_user_current ON cvs (user_id, is_current)');
  await knex.schema.raw('CREATE INDEX idx_cvs_user_version ON cvs (user_id, version DESC)');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Remove indexes
  await knex.schema.raw('DROP INDEX IF EXISTS idx_cvs_user_current');
  await knex.schema.raw('DROP INDEX IF EXISTS idx_cvs_user_version');

  // Remove columns from matches table
  await knex.schema.alterTable('matches', function(table) {
    table.dropColumn('cv_version');
    table.dropColumn('cv_content_snapshot');
  });

  // Remove columns from cvs table
  await knex.schema.alterTable('cvs', function(table) {
    table.dropColumn('version');
    table.dropColumn('is_current');
    table.dropColumn('source');
    table.dropColumn('change_summary');
  });
};