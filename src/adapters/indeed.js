const puppeteer = require('puppeteer-core');

class IndeedAdapter {
  constructor(config) {
    this.config = config;
    this.browser = null;
  }

  async init() {
    this.browser = await puppeteer.launch({
      executablePath: '/usr/local/bin/chromium',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
  }

  async fetchJobs() {
    if (!this.browser) {
      throw new Error('Adapter not initialized. Call init() first.');
    }

    const page = await this.browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('🔎 Navigating to Indeed jobs page...');
    await page.goto(this.config.searchUrl, { waitUntil: 'domcontentloaded' });

    // Handle cookie consent pop-up
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 5000 });
      await page.click('#onetrust-accept-btn-handler');
      console.log('🍪 Cookie consent accepted on Indeed.');
    } catch (e) {
      console.log('⚠️ No cookie consent pop-up found on Indeed, or it timed out.');
    }

    await page.waitForSelector('#mosaic-provider-jobcards');

    console.log('📝 Scraping job listings from Indeed...');
    const jobs = await page.evaluate(() => {
      const out = [];
      const jobElements = document.querySelectorAll('.job_seen_beacon');
      jobElements.forEach(el => {
        try {
          const titleEl = el.querySelector('h2.jobTitle > a');
          const companyEl = el.querySelector('[data-testid="company-name"]');
          const locationEl = el.querySelector('[data-testid="text-location"]');
          const linkEl = el.querySelector('a.jcs-JobTitle');

          if (titleEl && companyEl && linkEl) {
            out.push({
              title: titleEl.innerText.trim(),
              company: companyEl.innerText.trim(),
              location: locationEl ? locationEl.innerText.trim() : '',
              url: new URL(linkEl.href).href, // Get the full, clean URL
            });
          }
        } catch (e) {
          console.warn('Could not parse a job element on Indeed, skipping.');
        }
      });
      return out;
    });

    console.log(`📝 Found ${jobs.length} job(s) on Indeed.`);
    await page.close();
    return jobs;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = IndeedAdapter;
