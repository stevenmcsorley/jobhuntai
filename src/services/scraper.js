const fs = require('fs');

const BLOCK_KEYWORDS = [
  'ruby','rails','go','golang','php','java','c#','magento',
  'android','twilio','scala','haskell','perl','rust','delphi'
];

function isRelevant(job, stackKeywords) {
  const title = job.title.toLowerCase();
  const description = (job.description || '').toLowerCase();
  
  // Always exclude jobs with blocked keywords in the title
  if (BLOCK_KEYWORDS.some(k => title.includes(k))) {
    return false;
  }
  
  // If no stack keywords specified, include all jobs (user didn't set preferences)
  if (!stackKeywords || stackKeywords.length === 0) {
    return true;
  }
  
  // Check if any stack keyword appears in title or description
  const hasStackMatch = stackKeywords.some(keyword => {
    const k = keyword.trim().toLowerCase();
    return title.includes(k) || description.includes(k);
  });
  
  // For frontend/web roles, be more lenient if description isn't available yet
  if (!hasStackMatch && !description) {
    const frontendRoleKeywords = [
      'frontend', 'front-end', 'front end', 'web developer', 'ui developer', 
      'javascript developer', 'js developer', 'web', 'ui', 'ux'
    ];
    const isFrontendRole = frontendRoleKeywords.some(keyword => title.includes(keyword));
    const hasFrontendStack = stackKeywords.some(k => 
      ['react', 'vue', 'angular', 'javascript', 'js', 'typescript', 'ts', 'html', 'css'].includes(k.trim().toLowerCase())
    );
    
    // Include frontend roles if user has frontend stack preferences
    if (isFrontendRole && hasFrontendStack) {
      return true;
    }
  }
  
  return hasStackMatch;
}

async function scrapeAndSave(knex, adapters, stackKeywords = [], userId = null) {
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

      // Check for duplicates before attempting to insert (for this user only)
      const relevantUrls = relevantJobs.map(job => job.url);
      const existingJobsQuery = knex('jobs').whereIn('url', relevantUrls).select('url');
      if (userId) {
        existingJobsQuery.where('user_id', userId);
      }
      const existingJobs = await existingJobsQuery;
      const existingUrls = new Set(existingJobs.map(job => job.url));

      const jobsToInsert = relevantJobs
        .filter(job => !existingUrls.has(job.url))
        .map(job => ({
          ...job,
          scraped_at: new Date().toISOString(),
          source: adapter.constructor.name.replace('Adapter', '').toLowerCase(),
          user_id: userId
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
