console.log('[TEST] Starting test-server.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5003;

console.log('[TEST] Initializing knex...');
try {
    const knexConfig = require('../knexfile').development;
    const knex = require('knex')(knexConfig);
    console.log('[TEST] Knex initialized successfully.');

    // Perform a simple query to test the connection
    knex.raw('SELECT 1+1 as result').then(() => {
        console.log('[TEST] Database connection successful.');
    }).catch(err => {
        console.error('[TEST] Database connection failed:', err);
    });

} catch (err) {
    console.error('[TEST] Failed to initialize Knex:', err);
}

app.get('/', (req, res) => {
    res.send('Test server is running.');
});

app.listen(PORT, () => {
  console.log(`[TEST] Minimal server listening on http://localhost:${PORT}`);
});

// Keep the process alive for a bit longer to ensure we see async errors
setTimeout(() => {
    console.log('[TEST] Test server still running after 5 seconds.');
}, 5000);