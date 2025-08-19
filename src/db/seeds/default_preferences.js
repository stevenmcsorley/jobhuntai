exports.seed = async function(knex) {
  // Check if preferences already exist to avoid overwriting user data
  const existingPrefs = await knex('preferences').select('*');
  
  if (existingPrefs.length > 0) {
    console.log('✅ Preferences already exist, skipping defaults...');
    return;
  }

  console.log('🔧 Seeding default preferences...');
  
  // Insert default preferences
  await knex('preferences').insert([
    { key: 'keywords', value: 'Software Developer, Full Stack Developer, Frontend Developer' },
    { key: 'location', value: 'London' },
    { key: 'town', value: 'London' },
    { key: 'radius', value: '30' },
    { key: 'salary', value: '£60,000' },
    { key: 'stack_keywords', value: 'javascript,typescript,react,node.js,python,html,css,git' },
    { key: 'market_fit_skills', value: 'JavaScript,TypeScript,React,Node.js,Python,HTML,CSS,Git' }
  ]);
  
  console.log('✅ Default preferences seeded successfully!');
};