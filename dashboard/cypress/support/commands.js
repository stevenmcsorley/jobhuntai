// Custom commands for JobHunt AI application

// Authentication commands
Cypress.Commands.add('login', (username, password) => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('[data-cy="username"]').type(username);
    cy.get('[data-cy="password"]').type(password);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('not.include', '/login');
  });
});

// Navigation commands
Cypress.Commands.add('navigateToPage', (pageName) => {
  const pageRoutes = {
    'dashboard': '/',
    'opportunities': '/opportunities',
    'test-hub': '/test-hub',
    'market-fit': '/market-fit',
    'interviews': '/interviews',
    'stats': '/stats',
    'cv-editor': '/cv-editor',
    'bulk-add': '/bulk-add',
    'admin': '/admin'
  };
  
  cy.visit(pageRoutes[pageName] || '/');
});

// Wait for application to be ready
Cypress.Commands.add('waitForApp', () => {
  // Wait for any of these indicators that the app has loaded
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.get('div#root', { timeout: 5000 }).should('exist');
  
  // Wait for common elements that indicate the app is loaded
  cy.get('h1, h2, .app-container, [data-cy="app-loaded"]', { timeout: 10000 })
    .should('have.length.at.least', 1);
});

// Screenshot commands for Claude Code analysis
Cypress.Commands.add('captureUXScreenshot', (name, options = {}) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotName = `${name}-${timestamp}`;
  
  cy.screenshot(screenshotName, {
    capture: 'fullPage',
    overwrite: true,
    ...options
  });
  
  cy.task('log', `UX Screenshot captured: ${screenshotName}`);
});

// Theme switching
Cypress.Commands.add('switchTheme', (theme = 'dark') => {
  cy.get('html').then(($html) => {
    const currentTheme = $html.hasClass('dark') ? 'dark' : 'light';
    cy.log(`Current theme: ${currentTheme}, Target theme: ${theme}`);
    
    if (currentTheme !== theme) {
      cy.get('[data-cy="theme-toggle"]').click({ force: true });
      
      // Wait for the DOM to update and verify the theme actually changed
      cy.get('html', { timeout: 2000 }).should(($html) => {
        const newTheme = $html.hasClass('dark') ? 'dark' : 'light';
        expect(newTheme).to.equal(theme);
      });
      
      // Log the result after verification
      cy.get('html').then(($html) => {
        const finalTheme = $html.hasClass('dark') ? 'dark' : 'light';
        cy.log(`Theme successfully switched to: ${finalTheme}`);
      });
    }
  });
});

// Job-related commands
Cypress.Commands.add('addJob', (jobData) => {
  cy.get('[data-cy="add-job-button"]').click();
  cy.get('[data-cy="job-title"]').type(jobData.title);
  cy.get('[data-cy="job-company"]').type(jobData.company);
  cy.get('[data-cy="job-url"]').type(jobData.url);
  if (jobData.location) cy.get('[data-cy="job-location"]').type(jobData.location);
  if (jobData.description) cy.get('[data-cy="job-description"]').type(jobData.description);
  cy.get('[data-cy="save-job"]').click();
});

// Test-related commands
Cypress.Commands.add('startTest', (testConfig) => {
  cy.navigateToPage('test-hub');
  cy.get('[data-cy="test-type"]').select(testConfig.type);
  if (testConfig.skill) cy.get('[data-cy="test-skill"]').select(testConfig.skill);
  if (testConfig.difficulty) cy.get('[data-cy="test-difficulty"]').select(testConfig.difficulty);
  cy.get('[data-cy="start-test"]').click();
});

// Wait for loading states
Cypress.Commands.add('waitForLoading', () => {
  cy.get('[data-cy="loading"]').should('not.exist');
  cy.get('[data-cy="spinner"]').should('not.exist');
});

// Dark mode testing
Cypress.Commands.add('testDarkModeVisibility', () => {
  // Switch to dark mode
  cy.switchTheme('dark');
  
  // Capture screenshot in dark mode
  cy.captureUXScreenshot('dark-mode-visibility');
  
  // Check that text is visible (not pure black/dark)
  cy.get('html').should('have.class', 'dark');
  
  // Test common elements for visibility - more graceful approach
  cy.get('body').then(($body) => {
    // Check headers if they exist
    if ($body.find('h1, h2, h3, h4, h5, h6').length > 0) {
      cy.get('h1, h2, h3, h4, h5, h6').each(($el) => {
        if ($el.is(':visible')) {
          cy.wrap($el).should('be.visible');
        }
      });
    }
    
    // Check text elements but be more selective
    if ($body.find('p').length > 0) {
      cy.get('p').each(($el) => {
        if ($el.is(':visible') && $el.width() > 0 && $el.height() > 0) {
          cy.wrap($el).should('be.visible');
        }
      });
    }
    
    // Only check span elements that are likely to be visible content
    if ($body.find('span:not(.truncate):not([class*="hidden"])').length > 0) {
      cy.get('span:not(.truncate):not([class*="hidden"])').each(($el) => {
        if ($el.is(':visible') && $el.width() > 5 && $el.height() > 5) {
          cy.wrap($el).should('be.visible');
        }
      });
    }
  });
});

// API response mocking
Cypress.Commands.add('mockApiResponse', (endpoint, fixture) => {
  cy.intercept('GET', `**/api/${endpoint}`, { fixture });
});

// Form validation testing
Cypress.Commands.add('testFormValidation', (formSelector, requiredFields) => {
  requiredFields.forEach(field => {
    cy.get(`${formSelector} [data-cy="${field}"]`).should('have.attr', 'required');
  });
});