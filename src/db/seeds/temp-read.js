exports.seed = async function(knex) {
  const keywords = await knex('preferences').where('key', 'stack_keywords').first();
  console.log('Current stack_keywords:', keywords);
};