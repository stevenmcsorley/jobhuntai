const fs = require('fs');
const path = require('path');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Check if CV already exists in database
  const existingCv = await knex('cvs').where({ user_id: 1 }).first();
  
  if (!existingCv) {
    try {
      // Read the existing CV file
      const cvPath = path.resolve(__dirname, '../../../cv.txt');
      const cvContent = fs.readFileSync(cvPath, 'utf-8');
      
      // Insert the CV content into the database
      await knex('cvs').insert({
        user_id: 1,
        content: cvContent,
      });
      
      console.log('✅ Existing CV content migrated to database');
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  No existing CV file found, skipping seed');
      } else {
        console.error('❌ Error seeding CV:', error);
        throw error;
      }
    }
  } else {
    console.log('ℹ️  CV already exists in database, skipping seed');
  }
};