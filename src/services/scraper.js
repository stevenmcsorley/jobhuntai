const fs = require('fs');

const BLOCK_KEYWORDS = [
  'ruby','rails','go','golang','php','java','c#','magento',
  'android','twilio','scala','haskell','perl','rust','delphi'
];

function isRelevant(job, stackKeywords) {
  const t = job.title.toLowerCase();
  return stackKeywords.some(k => t.includes(k))
      && !BLOCK_KEYWORDS.some(k => t.includes(k));
}

async function scrapeAndSave(knex, adapters, stackKeywords = []) {
  let allNewJobs = [];
  for (const adapter of adapters) {
    try {
      await adapter.init();
      const jobs = await adapter.fetchJobs();
      await adapter.close();

      const relevantJobs = jobs.filter(job => isRelevant(job, stackKeywords));
      console.log(`🎯 ${relevantJobs.length} job(s) match your stack preferences from ${adapter.constructor.name}`);

      if (relevantJobs.length === 0) {
        console.log(`No new relevant jobs to save from ${adapter.constructor.name}.`);
        continue;
      }

      // Check for duplicates before attempting to insert
      const relevantUrls = relevantJobs.map(job => job.url);
      const existingJobs = await knex('jobs').whereIn('url', relevantUrls).select('url');
      const existingUrls = new Set(existingJobs.map(job => job.url));

      const jobsToInsert = relevantJobs
        .filter(job => !existingUrls.has(job.url))
        .map(job => ({
          ...job,
          scraped_at: new Date().toISOString(),
          source: adapter.constructor.name.replace('Adapter', '').toLowerCase()
        }));

      const duplicateCount = relevantJobs.length - jobsToInsert.length;
      if (duplicateCount > 0) {
        console.log(`🤫 Ignoring ${duplicateCount} job(s) that already exist in the database.`);
      }

      if (jobsToInsert.length === 0) {
        console.log(`No new relevant jobs to save from ${adapter.constructor.name}.`);
        continue;
      }

      // Insert new jobs, ignoring duplicates based on the 'url' constraint
      const inserted = await knex('jobs')
        .insert(jobsToInsert)
        .onConflict('url')
        .ignore()
        .returning('*');

      console.log(`💾 Saved ${inserted.length} new job(s) to the database from ${adapter.constructor.name}.`);
      allNewJobs = allNewJobs.concat(inserted);
    } catch (err) {
      console.error(`❌ An error occurred with the ${adapter.constructor.name}. Moving to the next adapter.`, err.message);
      // Ensure the browser is closed even if an error occurs mid-process
      await adapter.close();
    }
  }
  return allNewJobs;
}

module.exports = { scrapeAndSave };
