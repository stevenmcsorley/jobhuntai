/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // First, create a default user (user 1) for existing data
  const [userId] = await knex('users').insert({
    email: 'jobhunter@localhost',
    password_hash: '$2b$10$dummy.hash.for.initial.user', // This will need to be changed on first login
    name: 'Job Hunter',
    role: 'job_hunter',
    active: true
  }).returning('id');

  const actualUserId = userId?.id || userId; // Handle both object and direct ID return

  // Update all existing records to belong to user 1
  await Promise.all([
    knex('jobs').update({ user_id: actualUserId }),
    knex('applications').update({ user_id: actualUserId }),
    knex('matches').update({ user_id: actualUserId }),
    knex('profiles').update({ user_id: actualUserId }),
    knex('skills').update({ user_id: actualUserId }),
    knex('work_experiences').update({ user_id: actualUserId }),
    knex('projects').update({ user_id: actualUserId }),
    knex('education').update({ user_id: actualUserId }),
    knex('cvs').update({ user_id: actualUserId }),
    knex('test_sessions').update({ user_id: actualUserId }),
    knex('guidance').update({ user_id: actualUserId }),
    knex('preferences').update({ user_id: actualUserId })
  ]);

  console.log(`✅ Migrated existing data to user ID: ${actualUserId}`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Remove the default user and reset user_id columns to NULL
  await Promise.all([
    knex('jobs').update({ user_id: null }),
    knex('applications').update({ user_id: null }),
    knex('matches').update({ user_id: null }),
    knex('profiles').update({ user_id: null }),
    knex('skills').update({ user_id: null }),
    knex('work_experiences').update({ user_id: null }),
    knex('projects').update({ user_id: null }),
    knex('education').update({ user_id: null }),
    knex('cvs').update({ user_id: null }),
    knex('test_sessions').update({ user_id: null }),
    knex('guidance').update({ user_id: null }),
    knex('preferences').update({ user_id: null })
  ]);

  // Delete the default user
  await knex('users').where({ email: 'jobhunter@localhost' }).del();
};