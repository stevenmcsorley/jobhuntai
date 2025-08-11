const puppeteer = require('puppeteer-core');

class LinkedInAdapter {
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

    console.log('🔐 Logging into LinkedIn...');
    await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle2' });
    await page.type('#username', this.config.email);
    await page.type('#password', this.config.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Logged in successfully.');

    console.log('🔎 Navigating to LinkedIn jobs page...');
    await page.goto(this.config.searchUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.jobs-search__results-list');

    console.log('📝 Scraping job listings...');
    const jobs = await page.evaluate(() => {
      const out = [];
      const jobElements = document.querySelectorAll('.jobs-search__results-list li');
      jobElements.forEach(el => {
        try {
          const titleEl = el.querySelector('.job-card-list__title');
          const companyEl = el.querySelector('.job-card-container__primary-description');
          const locationEl = el.querySelector('.job-card-container__metadata-item');
          const linkEl = el.querySelector('a.job-card-container__link');

          if (titleEl && companyEl && linkEl) {
            out.push({
              title: titleEl.innerText.trim(),
              company: companyEl.innerText.trim(),
              location: locationEl ? locationEl.innerText.trim() : '',
              url: linkEl.href.split('?')[0], // Get the base URL of the job
            });
          }
        } catch (e) {
          console.warn('Could not parse a job element on LinkedIn, skipping.');
        }
      });
      return out;
    });

    console.log(`📝 Found ${jobs.length} job(s) on LinkedIn.`);
    await page.close();
    return jobs;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = LinkedInAdapter;