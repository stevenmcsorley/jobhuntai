const puppeteer = require('puppeteer-core');

class CWJobsAdapter {
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
        '--single-process',
        '--no-zygote'
      ]
    });
  }

  async fetchJobs() {
    console.log(`🔍 Scraping CWJobs for "${this.config.keywords}" in "${this.config.location}"...`);
    if (!this.browser) {
      throw new Error('Adapter not initialized. Call init() first.');
    }
    const page = await this.browser.newPage();
    
    console.log(`Navigating to search URL: ${this.config.searchUrl}`);
    await page.goto(this.config.searchUrl, { waitUntil: 'networkidle2' });

    try {
      const acceptButton = await page.waitForSelector('#ccmgt_explicit_accept', { timeout: 3000 });
      if (acceptButton) {
        await page.click('#ccmgt_explicit_accept');
        console.log('🍪 Cookie consent accepted');
      }
    } catch {
      console.log('⚠️ No cookie consent popup found, continuing...');
    }

    // Check for "no results" page
    const noResults = await page.evaluate(() => {
        const noResultsEl = document.querySelector('.no-results'); // A common class for such pages
        if (noResultsEl) {
            return noResultsEl.textContent.trim();
        }
        const pageTitle = document.querySelector('h1');
        if(pageTitle && pageTitle.textContent.toLowerCase().includes('no jobs found')) {
            return pageTitle.textContent.trim();
        }
        return null;
    });

    if (noResults) {
        console.log(`🤷 No jobs found on CWJobs for this search: "${noResults}"`);
        await page.close();
        return [];
    }

    console.log('Waiting for job list to load...');
    try {
      await page.waitForSelector('h2 > a', { timeout: 10000 });
      console.log('Job list loaded.');
    } catch (e) {
      console.log('No jobs found on the page or the selector "h2 > a" is incorrect.');
      await page.screenshot({ path: 'cwjobs-no-jobs-found-error.png' });
      console.log('📸 A screenshot of the page has been saved to cwjobs-no-jobs-found-error.png');
      await page.close();
      return []; // Return empty array if no jobs are found
    }

    const jobs = await page.evaluate(() => {
      const anchors = document.querySelectorAll('h2 > a');
      if (!anchors || anchors.length === 0) {
        return [];
      }
      
      return Array.from(anchors).map(anchor => {
        const title = anchor.textContent.trim();
        const url = anchor.href;

        const h2 = anchor.parentElement;
        const sibs = Array.from(h2.parentElement.children);
        const idx = sibs.indexOf(h2);

        const company = sibs[idx + 1]?.textContent.trim() || null;
        const location = sibs[idx + 2]?.textContent.trim() || null;

        let salary = null;
        for (let i = idx + 1; i < idx + 5 && !salary && sibs[i]; i++) {
          const t = sibs[i].textContent;
          if (t.includes('£')) salary = t.trim();
        }

        let posted = null;
        for (let i = idx + 1; i < idx + 6 && !posted && sibs[i]; i++) {
          const t = sibs[i].textContent.trim();
          if (/ago$/.test(t)) posted = t;
        }

        return { title, company, location, salary, posted, url };
      });
    });

    console.log(`📝 Found ${jobs.length} job(s)`);
    await page.close();
    return jobs;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

module.exports = CWJobsAdapter;
