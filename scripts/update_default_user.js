const knex = require('knex');
const bcrypt = require('bcryptjs');

const knexConfig = require('../knexfile').development;
const db = knex(knexConfig);

async function updateDefaultUser() {
  try {
    // Check if default user exists
    const defaultUser = await db('users').where({ email: 'jobhunter@localhost' }).first();
    
    if (defaultUser) {
      console.log('Default user found:', defaultUser.email);
      
      // Update with a proper password hash
      const newPassword = 'password123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await db('users')
        .where({ id: defaultUser.id })
        .update({ password_hash: hashedPassword });
      
      console.log(`✅ Updated default user password. Login with:`);
      console.log(`   Email: jobhunter@localhost`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ Default user not found');
    }
    
    // List all users
    const allUsers = await db('users').select('id', 'email', 'name', 'role');
    console.log('\nAll users:');
    allUsers.forEach(user => {
      console.log(`  ${user.id}: ${user.email} (${user.name}) - ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.destroy();
  }
}

updateDefaultUser();