import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I visit the preferences page', () => {
  cy.visitPage('preferences');
});

Then('I should see the preferences page title', () => {
  cy.get('[data-testid="preferences-page-title"]')
    .should('be.visible')
    .and('contain', 'Search Preferences');
});

Then('I should see the save preferences button', () => {
  cy.get('[data-testid="save-preferences-button"]')
    .should('be.visible')
    .and('contain', 'Save Preferences');
});

Then('I should see the preferences form', () => {
  cy.get('[data-testid="preferences-form"]')
    .should('be.visible')
    .and('not.be.empty');
});

Then('I should see the keywords input field', () => {
  cy.get('[data-testid="keywords-input"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

Then('I should see the stack keywords textarea', () => {
  cy.get('[data-testid="stack-keywords-textarea"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

Then('I should see the market fit skills textarea', () => {
  cy.get('[data-testid="market-fit-skills-textarea"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

Then('I should see the town input field', () => {
  cy.get('[data-testid="town-input"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

Then('I should see the radius select dropdown', () => {
  cy.get('[data-testid="radius-select"]')
    .should('be.visible')
    .and('be.enabled');
});

Then('I should see the location input field', () => {
  cy.get('[data-testid="location-input"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

Then('I should see the salary input field', () => {
  cy.get('[data-testid="salary-input"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

When('I type {string} in the keywords input', (text) => {
  cy.get('[data-testid="keywords-input"]')
    .clear()
    .type(text);
});

When('I type {string} in the stack keywords textarea', (text) => {
  cy.get('[data-testid="stack-keywords-textarea"]')
    .clear()
    .type(text);
});

When('I type {string} in the market fit skills textarea', (text) => {
  cy.get('[data-testid="market-fit-skills-textarea"]')
    .clear()
    .type(text);
});

Then('the form fields should contain the entered values', () => {
  cy.get('[data-testid="keywords-input"]')
    .should('have.value', 'React Developer');
  cy.get('[data-testid="stack-keywords-textarea"]')
    .should('have.value', 'react,javascript,typescript');
  cy.get('[data-testid="market-fit-skills-textarea"]')
    .should('have.value', 'React,JavaScript,TypeScript');
});

When('I click the save preferences button', () => {
  cy.get('[data-testid="save-preferences-button"]')
    .click();
});

Then('the button should show saving state', () => {
  cy.get('[data-testid="save-preferences-button"]')
    .should('contain', 'Saving...')
    .and('be.disabled');
});

Then('the preferences form should be properly laid out', () => {
  cy.get('[data-testid="preferences-form"]')
    .should('be.visible')
    .within(() => {
      cy.get('label').should('have.length.greaterThan', 5);
      cy.get('input, textarea, select').should('have.length.greaterThan', 5);
    });
});

Then('form fields should be appropriately sized', () => {
  cy.get('[data-testid="keywords-input"]')
    .should('have.class', 'w-full');
  cy.get('[data-testid="stack-keywords-textarea"]')
    .should('have.class', 'w-full');
  cy.get('[data-testid="market-fit-skills-textarea"]')
    .should('have.class', 'w-full');
});

Then('labels should be clearly visible', () => {
  cy.get('[data-testid="preferences-form"]')
    .within(() => {
      cy.get('label').each(($label) => {
        cy.wrap($label)
          .should('be.visible')
          .and('not.be.empty');
      });
    });
});

When('I select {string} from the radius dropdown', (value) => {
  cy.get('[data-testid="radius-select"]')
    .select(value);
});

When('I enter {string} in the town field', (text) => {
  cy.get('[data-testid="town-input"]')
    .clear()
    .type(text);
});

When('I enter {string} in the salary field', (text) => {
  cy.get('[data-testid="salary-input"]')
    .clear()
    .type(text);
});

Then('the form should accept various input formats', () => {
  cy.get('[data-testid="radius-select"]')
    .should('have.value', '20');
  cy.get('[data-testid="town-input"]')
    .should('have.value', 'Manchester');
  cy.get('[data-testid="salary-input"]')
    .should('have.value', '£70,000');
});