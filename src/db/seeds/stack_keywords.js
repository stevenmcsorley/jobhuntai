
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('preferences').where('key', 'stack_keywords').del();
  await knex('preferences').insert([
    {key: 'stack_keywords', value: 'frontend,front end,react,next.js,javascript,typescript,node,full stack,fullstack,ui,software developer,software engineer,developer,engineer'}
  ]);
};
