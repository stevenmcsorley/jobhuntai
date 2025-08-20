import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Test Hub specific step definitions

Then('I should see a test question', () => {
  cy.get('[data-cy="test-question"]')
    .or(cy.contains('Question:'))
    .or(cy.get('h3').contains('Question'))
    .should('be.visible');
});

Then('I should see multiple choice options', () => {
  cy.get('input[type="radio"]')
    .or(cy.get('[data-cy="mcq-option"]'))
    .should('have.length.at.least', 2);
});

Then('I should see a code editor', () => {
  cy.get('.monaco-editor')
    .or(cy.get('[data-cy="code-editor"]'))
    .or(cy.get('textarea[placeholder*="code"]'))
    .should('be.visible');
});

Then('I should see language selection', () => {
  cy.get('select')
    .contains('JavaScript')
    .or(cy.get('[data-cy="language-select"]'))
    .should('be.visible');
});

Then('I should see information about STAR method', () => {
  cy.contains('STAR')
    .or(cy.contains('Situation, Task, Action, Result'))
    .should('be.visible');
});

Then('I should see a behavioral question', () => {
  cy.get('[data-cy="behavioral-question"]')
    .or(cy.contains('Tell me about a time'))
    .or(cy.contains('Describe a situation'))
    .should('be.visible');
});

Then('I should see test history table', () => {
  cy.get('table')
    .or(cy.get('[data-cy="test-history"]'))
    .should('be.visible');
});

Then('I should see past test results', () => {
  cy.get('table tbody tr')
    .or(cy.get('[data-cy="test-result"]'))
    .should('exist');
});

Then('dropdown text should be visible', () => {
  // Test dropdowns by opening them
  cy.get('select').each(($select) => {
    cy.wrap($select).should('be.visible');
    // Check if select has options
    cy.wrap($select).find('option').should('have.length.at.least', 1);
  });
});

// Test configuration steps
When('I configure a {string} test with {string} skill at {string} level', (testType, skill, difficulty) => {
  cy.get('[data-cy="test-type"]')
    .or(cy.get('select').first())
    .select(testType);
  
  if (skill) {
    cy.get('[data-cy="test-skill"]')
      .or(cy.get('select').eq(1))
      .select(skill);
  }
  
  if (difficulty) {
    cy.get('[data-cy="test-difficulty"]')
      .or(cy.get('select').last())
      .select(difficulty);
  }
});

Then('I should see test configuration options', () => {
  cy.get('[data-cy="test-type"]').should('be.visible');
  cy.get('select').should('have.length.at.least', 1);
});

When('I submit a test answer', () => {
  cy.get('[data-cy="submit-answer"]')
    .or(cy.contains('button', 'Submit'))
    .click();
});

Then('I should see test results', () => {
  cy.get('[data-cy="test-results"]')
    .or(cy.contains('Test Complete'))
    .should('be.visible');
});