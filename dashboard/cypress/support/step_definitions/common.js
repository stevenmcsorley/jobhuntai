import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Common step definitions

Given('I am on the {string} page', (pageName) => {
  cy.navigateToPage(pageName);
  cy.waitForApp();
});

Given('I visit the application', () => {
  cy.visit('/');
  cy.waitForApp();
});

Given('the application is in {string} mode', (theme) => {
  cy.switchTheme(theme);
});

When('I click on {string}', (elementText) => {
  cy.contains(elementText).click();
});

When('I click the {string} button', (buttonText) => {
  const selector = buttonText.toLowerCase().replace(/\s+/g, '-');
  cy.get('body').then(($body) => {
    if ($body.find(`[data-cy*="${selector}"]`).length) {
      cy.get(`[data-cy*="${selector}"]`).click();
    } else {
      cy.contains('button', buttonText).click();
    }
  });
});

When('I fill in {string} with {string}', (fieldName, value) => {
  const selector = fieldName.toLowerCase().replace(/\s+/g, '-');
  cy.get('body').then(($body) => {
    if ($body.find(`[data-cy="${selector}"]`).length) {
      cy.get(`[data-cy="${selector}"]`).type(value);
    } else if ($body.find(`[name="${fieldName}"]`).length) {
      cy.get(`[name="${fieldName}"]`).type(value);
    } else {
      cy.get(`[placeholder*="${fieldName}"]`).type(value);
    }
  });
});

When('I select {string} from {string}', (optionValue, selectName) => {
  const selector = selectName.toLowerCase().replace(/\s+/g, '-');
  cy.get('body').then(($body) => {
    if ($body.find(`[data-cy="${selector}"]`).length) {
      cy.get(`[data-cy="${selector}"]`).select(optionValue);
    } else {
      cy.get(`select[name="${selectName}"]`).select(optionValue);
    }
  });
});

When('I wait for the page to load', () => {
  cy.waitForLoading();
});

Then('I should see {string}', (text) => {
  cy.contains(text).should('be.visible');
});

Then('I should not see {string}', (text) => {
  cy.contains(text).should('not.exist');
});

Then('I should be on the {string} page', (pageName) => {
  const pageRoutes = {
    'dashboard': '/',
    'opportunities': '/opportunities',
    'test-hub': '/test-hub',
    'market-fit': '/market-fit',
    'interviews': '/interviews'
  };
  
  cy.url().should('include', pageRoutes[pageName] || `/${pageName}`);
});

Then('the {string} field should be required', (fieldName) => {
  const selector = fieldName.toLowerCase().replace(/\s+/g, '-');
  cy.get('body').then(($body) => {
    if ($body.find(`[data-cy="${selector}"]`).length) {
      cy.get(`[data-cy="${selector}"]`).should('have.attr', 'required');
    } else {
      cy.get(`[name="${fieldName}"]`).should('have.attr', 'required');
    }
  });
});

Then('I should see a loading indicator', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="loading"]').length) {
      cy.get('[data-cy="loading"]').should('be.visible');
    } else {
      cy.get('[data-cy="spinner"]').should('be.visible');
    }
  });
});

Then('the loading indicator should disappear', () => {
  cy.waitForLoading();
});

Then('I capture a screenshot for analysis', () => {
  // Cypress automatically captures screenshots on failures
  // We can explicitly capture one if needed for analysis
  cy.captureUXScreenshot('manual-capture');
});