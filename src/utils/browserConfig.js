/**
 * Browser configuration utility for cross-platform compatibility
 */

const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Detects available browser executable path
 */
function getBrowserExecutablePath() {
  const possiblePaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/local/bin/chromium',
    '/opt/google/chrome/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // macOS
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe' // Windows 32-bit
  ];

  // Check each possible path
  for (const path of possiblePaths) {
    try {
      if (fs.existsSync(path)) {
        console.log(`✅ Browser found at: ${path}`);
        return path;
      }
    } catch (error) {
      // Continue checking other paths
    }
  }

  // Try using 'which' command on Unix-like systems
  try {
    const browsers = ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium'];
    for (const browser of browsers) {
      try {
        const path = execSync(`which ${browser}`, { encoding: 'utf8' }).trim();
        if (path) {
          console.log(`✅ Browser found via 'which': ${path}`);
          return path;
        }
      } catch (error) {
        // Continue to next browser
      }
    }
  } catch (error) {
    // 'which' command not available or failed
  }

  // Fallback: try to use system default
  console.warn('⚠️  No browser found at common paths. Trying system default...');
  return null; // Let Puppeteer use its default
}

/**
 * Get optimized browser launch options for different environments
 */
function getBrowserLaunchOptions(headless = true) {
  const executablePath = getBrowserExecutablePath();
  
  const baseOptions = {
    headless: headless,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images', // Faster loading
      '--disable-javascript', // For scraping, we often don't need JS
    ]
  };

  // Add executable path if found
  if (executablePath) {
    baseOptions.executablePath = executablePath;
  }

  // Environment-specific optimizations
  if (process.env.NODE_ENV === 'production') {
    baseOptions.args.push(
      '--single-process',
      '--no-zygote',
      '--memory-pressure-off'
    );
  }

  // Docker-specific settings
  if (process.env.DOCKER_ENV || fs.existsSync('/.dockerenv')) {
    baseOptions.args.push(
      '--disable-dev-shm-usage',
      '--shm-size=1gb'
    );
  }

  return baseOptions;
}

/**
 * Validate browser installation and provide helpful error messages
 */
function validateBrowserInstallation() {
  const executablePath = getBrowserExecutablePath();
  
  if (!executablePath) {
    const installCommands = {
      ubuntu: 'sudo apt update && sudo apt install google-chrome-stable',
      debian: 'sudo apt update && sudo apt install google-chrome-stable',
      centos: 'sudo yum install google-chrome-stable',
      fedora: 'sudo dnf install google-chrome-stable',
      arch: 'sudo pacman -S google-chrome',
      macos: 'brew install --cask google-chrome',
      generic: 'Please install Google Chrome or Chromium browser'
    };

    console.error('❌ No compatible browser found!');
    console.error('📦 To install Google Chrome:');
    Object.entries(installCommands).forEach(([os, cmd]) => {
      console.error(`   ${os}: ${cmd}`);
    });
    
    throw new Error('No compatible browser found. Please install Google Chrome or Chromium.');
  }

  return true;
}

module.exports = {
  getBrowserExecutablePath,
  getBrowserLaunchOptions,
  validateBrowserInstallation
};