const knex = require('knex');
const fs = require('fs').promises;
const path = require('path');

const knexConfig = require('../knexfile').development;
const db = knex(knexConfig);

async function backupSchema() {
  try {
    // Get all table names
    const tables = await db.raw("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'knex_migrations' AND name != 'knex_migrations_lock'");
    
    let schemaDoc = `-- Database Schema Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
    let dataDoc = `-- Database Data Sample Backup\n-- Generated: ${new Date().toISOString()}\n\n`;
    
    for (const table of tables) {
      const tableName = table.name;
      console.log(`Processing table: ${tableName}`);
      
      // Get table schema
      const schema = await db.raw(`PRAGMA table_info(${tableName})`);
      schemaDoc += `-- Table: ${tableName}\n`;
      schemaDoc += `CREATE TABLE ${tableName} (\n`;
      
      const columns = schema.map(col => {
        let def = `  ${col.name} ${col.type}`;
        if (col.pk) def += ' PRIMARY KEY';
        if (col.notnull && !col.pk) def += ' NOT NULL';
        if (col.dflt_value !== null) def += ` DEFAULT ${col.dflt_value}`;
        return def;
      });
      
      schemaDoc += columns.join(',\n') + '\n);\n\n';
      
      // Get sample data (first 5 rows)
      const sampleData = await db(tableName).limit(5);
      dataDoc += `-- Table: ${tableName} (${sampleData.length} sample rows)\n`;
      if (sampleData.length > 0) {
        dataDoc += `-- Columns: ${Object.keys(sampleData[0]).join(', ')}\n`;
        sampleData.forEach(row => {
          dataDoc += `-- ${JSON.stringify(row)}\n`;
        });
      }
      dataDoc += '\n';
      
      // Get row count
      const count = await db(tableName).count('* as count').first();
      dataDoc += `-- Total rows in ${tableName}: ${count.count}\n\n`;
    }
    
    // Save files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    await fs.writeFile(`backups/schema_${timestamp}.sql`, schemaDoc);
    await fs.writeFile(`backups/data_sample_${timestamp}.txt`, dataDoc);
    
    console.log('✅ Schema backup completed successfully');
    console.log(`📁 Files created:`);
    console.log(`   - backups/schema_${timestamp}.sql`);
    console.log(`   - backups/data_sample_${timestamp}.txt`);
    
  } catch (error) {
    console.error('❌ Error backing up schema:', error);
  } finally {
    await db.destroy();
  }
}

backupSchema();