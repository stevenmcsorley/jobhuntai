const puppeteer = require('puppeteer-core');

const CWJOBS_EMAIL = process.env.CWJOBS_EMAIL;
const CWJOBS_PASSWORD = process.env.CWJOBS_PASSWORD;
const CWJOBS_LOGIN_URL = 'https://www.cwjobs.co.uk/account/signin';

if (!CWJOBS_EMAIL || !CWJOBS_PASSWORD) {
  throw new Error('Missing CWJOBS_EMAIL or CWJOBS_PASSWORD in your .env');
}

let browser;
async function getBrowser() {
  if (browser) return browser;
  browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote'
    ]
  });
  return browser;
}

async function login(page) {
  console.log('🔐 Attempting to log into CWJobs...');
  await page.goto(CWJOBS_LOGIN_URL, { waitUntil: 'networkidle2' });

  // Handle cookie pop-up first
  try {
    const cookieButton = await page.waitForSelector('#ccmgt_explicit_accept', { timeout: 3000, visible: true });
    await cookieButton.click();
    console.log('🍪 Cookie consent accepted.');
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for banner
  } catch (e) {
    console.log('⚠️ No cookie consent popup found or it was not visible.');
  }

  // Check if we are already logged in by looking for a "My Account" link
  const myAccountLink = await page.$('a[href="/Account/Default.aspx"]');
  if (myAccountLink) {
    console.log('✅ Already logged in.');
    return;
  }

  // If not logged in, find the form and sign in
  console.log('Not logged in. Proceeding with sign-in...');
  try {
    await page.type('#Email', CWJOBS_EMAIL);
    await page.type('#Password', CWJOBS_PASSWORD);
    await page.click('#btn-signin');
    
    // Wait for navigation and the "My Account" link to confirm login
    await page.waitForSelector('a[href="/Account/Default.aspx"]', { timeout: 10000 });
    console.log('✅ Login successful.');
  } catch (e) {
    await page.screenshot({ path: 'cwjobs-login-error.png' });
    throw new Error(`Could not log into CWJobs. Screenshot saved. Original error: ${e.message}`);
  }
}

async function applyToJob(knex, job, matchResult) {
  const b = await getBrowser();
  const page = await b.newPage();
  const meta = {
    score: matchResult.score,
    reasons: matchResult.reasons
  };

  try {
    await login(page);

    console.log(`Navigating to job page: ${job.url}`);
    await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 15000 });

    // Check if the job is expired or no longer available
    const isJobUnavailable = await page.evaluate(() => {
      const bodyText = document.body.innerText.toLowerCase();
      return bodyText.includes('this job has expired') || 
             bodyText.includes('job is no longer available') ||
             bodyText.includes('this listing went offline');
    });

    if (isJobUnavailable) {
      console.log(`🚫 Job is no longer available: ${job.title}`);
      await knex('applications').where({ job_id: job.id }).update({ status: 'rejected', meta: JSON.stringify({ ...meta, error: 'Job is no longer available.' }) });
      return { status: 'expired' };
    }

    // Check for "Already Applied" button first
    const alreadyAppliedSelector = '[data-testid="harmonised-apply-button"][disabled]';
    const isAlreadyApplied = await page.$(alreadyAppliedSelector);
    if (isAlreadyApplied) {
        const buttonText = await page.evaluate(el => el.textContent, isAlreadyApplied);
        if (buttonText.toLowerCase().includes('already applied')) {
            console.log(`✅ Already applied to: ${job.title}`);
            await knex('applications').where({ job_id: job.id }).update({ status: 'applied' });
            return { status: 'already_applied' };
        }
    }

    // Find and click the initial Apply/Continue button
    const initialApplyButtonSelector = '[data-testid="harmonised-apply-button"]:not([disabled])';
    try {
        const applyButton = await page.waitForSelector(initialApplyButtonSelector, { timeout: 5000 });
        const buttonText = await page.evaluate(el => el.textContent, applyButton);
        console.log(`Initial action button found: "${buttonText}"`);
        await knex('jobs').where({ id: job.id }).update({ apply_button_text: buttonText });
        await applyButton.click();
    } catch (e) {
        await page.screenshot({ path: 'cwjobs-apply-error.png' });
        throw new Error(`Could not find the initial "Apply" or "Continue" button. Screenshot saved. Original error: ${e.message}`);
    }

    // Now, figure out the next step by waiting for one of the possible outcomes
    const reviewApplicationSelector = 'button[data-testid="review-application-button"]';
    const sendApplicationSelector = '[data-testid="sendApplication"]';
    const continueToCompanySiteSelector = '[data-testid="continueToCompanySite"]';

    try {
        console.log('Waiting for the next step...');
        await page.waitForSelector(`${reviewApplicationSelector}, ${sendApplicationSelector}, ${continueToCompanySiteSelector}`, { timeout: 10000 });

        // Case 1: "Continue to company site" button is found
        const continueButton = await page.$(continueToCompanySiteSelector);
        if (continueButton) {
            const externalUrl = page.url();
            console.log(`🚪 External application required for ${job.title} at ${externalUrl}`);
            await knex('applications').where({ job_id: job.id }).update({ status: 'external' });
            return { status: 'external', url: externalUrl };
        }

        // Case 2: "Review application" button is found (multi-step)
        const reviewButton = await page.$(reviewApplicationSelector);
        if (reviewButton) {
            console.log('"Review application" button found. Clicking it...');
            await reviewButton.click();
            
            console.log('Waiting for final "Send application" button...');
            const finalSendButton = await page.waitForSelector(sendApplicationSelector, { timeout: 10000 });
            // await finalSendButton.click(); // UNCOMMENT TO APPLY
            console.log(`✅ Auto-applied to: ${job.title}`);
            await knex('applications').where({ job_id: job.id }).update({
                status: 'applied',
                applied_at: new Date().toISOString()
            });
            return { status: 'applied' };
        }

        // Case 3: "Send application" button is found directly
        const sendButton = await page.$(sendApplicationSelector);
        if (sendButton) {
            console.log('Direct "Send application" button found.');
            // await sendButton.click(); // UNCOMMENT TO APPLY
            console.log(`✅ Auto-applied to: ${job.title}`);
            await knex('applications').where({ job_id: job.id }).update({
                status: 'applied',
                applied_at: new Date().toISOString()
            });
            return { status: 'applied' };
        }

        throw new Error('Waited for next step, but could not identify which button to press.');

    } catch (e) {
        await page.screenshot({ path: 'cwjobs-apply-error.png' });
        throw new Error(`Could not complete application process. Screenshot saved. Original error: ${e.message}`);
    }
  } catch (err) {
    console.warn(`📌 Non-standard apply for ${job.title}, marking for follow-up. Error: ${err.message}`);
    await page.screenshot({ path: 'cwjobs-apply-error.png' });
    console.log('📸 A screenshot of the error page has been saved to cwjobs-apply-error.png');
    
    await knex('applications').where({ job_id: job.id }).update({
      status: 'followup',
      meta: JSON.stringify({ ...meta, error: err.message })
    });
    return { status: 'followup', error: err.message, url: job.url };
  } finally {
    await page.close();
  }
}

async function closeBrowser() {
    if (browser) {
        await browser.close();
        browser = null;
    }
}

module.exports = { applyToJob, closeBrowser };
