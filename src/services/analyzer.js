const puppeteer = require('puppeteer-core');
const { getBrowserLaunchOptions } = require('../utils/browserConfig');

let browser;
async function getBrowser() {
  if (browser) return browser;
  const launchOptions = getBrowserLaunchOptions(true);
  // Add HTTP2 fix
  launchOptions.args.push('--disable-http2');
  browser = await puppeteer.launch(launchOptions);
  return browser;
}

async function scrapeDescription(url) {
  const b = await getBrowser();
  const page = await b.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/120.0.0.0 Safari/537.36'
  );

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (err) {
    if (err.message.includes('ERR_HTTP2_PROTOCOL_ERROR')) {
      console.warn(`⚠️ HTTP2 error on ${url}, retrying over HTTP/1...`);
      await page.goto(url, { waitUntil: 'load', timeout: 30000 });
    } else {
      throw err;
    }
  }

  const description = await page.$eval(
    '#JobAdContent',
    el => el.innerText.trim()
  );
  await page.close();
  return description;
}

async function analyzeAndSaveJob(knex, job) {
  console.log(`🔎 Analyzing job: ${job.title}`);
  try {
    const description = await scrapeDescription(job.url);
    await knex('jobs')
      .where({ id: job.id })
      .update({ description: description });
    console.log(`✅ Analysis complete. Saved description for: ${job.title}`);
    return { ...job, description };
  } catch (err) {
    console.error(`❌ Error analyzing job ${job.id}: ${err.message}`);
    throw err;
  }
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

module.exports = { analyzeAndSaveJob, closeBrowser };
