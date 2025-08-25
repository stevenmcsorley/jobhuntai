/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add user_id to interviews table
  await knex.schema.table('interviews', function(table) {
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.index('user_id');
  });
  
  // Add source to applications table  
  await knex.schema.table('applications', function(table) {
    table.string('source');
    table.index('source');
  });
  
  // Update existing interviews to belong to the default user (user 1)
  await knex('interviews').update({ user_id: 1 });
  
  // Update existing applications to get source from their related jobs
  const applicationsWithJobs = await knex('applications')
    .join('jobs', 'applications.job_id', '=', 'jobs.id')
    .select('applications.id as app_id', 'jobs.source');
    
  for (const app of applicationsWithJobs) {
    await knex('applications')
      .where('id', app.app_id)
      .update({ source: app.source });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('interviews', function(table) {
    table.dropColumn('user_id');
  });
  
  await knex.schema.table('applications', function(table) {
    table.dropColumn('source');
  });
};