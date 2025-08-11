
exports.seed = async function(knex) {
  // Update the search keywords
  await knex('preferences')
    .where('key', 'keywords')
    .update({ value: 'Senior Front-End Developer, Software Engineer, React Developer, Full-Stack Developer' });

  // Update the stack keywords
  await knex('preferences')
    .where('key', 'stack_keywords')
    .update({ value: 'React, Node.js, TypeScript, Vue, JavaScript, Remix, MongoDB, Docker, Cypress, BDD, Vitest, API, Vanilla.js, Umbraco, Drupal, Twig, SCSS, PHP, JQuery, SQL, Front-End, Full-Stack' });
};
