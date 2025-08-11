
module.exports = async (knex) => {
  await knex('preferences').insert({
    key: 'stack_keywords',
    value: 'frontend,front end,react,next.js,javascript,typescript,node,full stack,fullstack,ui,software developer,software engineer,developer,engineer'
  }).onConflict('key').merge();
  console.log('Stack keywords inserted/updated.');
};
