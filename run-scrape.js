// A standalone script to run the scraper and then exit.
require('dotenv').config();
const path = require('path');
const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);
const CWJobsAdapter = require('./src/adapters/cwjobs');
const LinkedInAdapter = require('./src/adapters/linkedin');
const IndeedAdapter = require('./src/adapters/indeed');
const scraper = require('./src/services/scraper');
const config = require('./config.json');

async function main() {
  console.log('🚀 Starting standalone scrape...');
  let allNewJobs = [];
  try {
    const adapters = [
      new CWJobsAdapter({
        loginUrl: 'https://www.cwjobs.co.uk/account/signin',
        searchUrl: config.cwjobs.searchUrl,
        email: process.env.CWJOBS_EMAIL,
        password: process.env.CWJOBS_PASSWORD
      }),
      // You can add other adapters here if needed
      // new LinkedInAdapter({ ... }),
      // new IndeedAdapter({ ... })
    ];

    allNewJobs = await scraper.scrapeAndSave(knex, adapters);
    console.log(`✅ Standalone scrape complete. Found and saved ${allNewJobs.length} total new jobs.`);

  } catch (error) {
    console.error('❌ An error occurred during the standalone scrape:', error);
    process.exitCode = 1; // Set exit code to 1 to indicate failure
  } finally {
    // Ensure all resources are closed properly
    console.log('...Closing database connection...');
    await knex.destroy();
    console.log('Database connection closed. Script will now exit.');
    // No need for process.exit(), Node.js will exit automatically
    // as long as there are no more open handles.
  }
}

main();