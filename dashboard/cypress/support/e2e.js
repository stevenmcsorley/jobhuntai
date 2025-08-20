// Import Cypress commands
import './commands';
import './screenshot-helper';

// Import Cypress plugins
import 'cypress-real-events';

// Global before hook for all tests
before(() => {
  // Clear any existing data
  cy.task('log', 'Starting test suite - clearing any existing data');
});

beforeEach(() => {
  // Set up common test state
  cy.viewport(1280, 720);
  
  // Handle uncaught exceptions gracefully
  Cypress.on('uncaught:exception', (err, runnable) => {
    // Return false to prevent Cypress from failing the test
    return false;
  });
});

afterEach(() => {
  // Capture screenshot after each test for Claude Code analysis
  cy.screenshot({ capture: 'fullPage', overwrite: true });
});

// Global after hook
after(() => {
  cy.task('log', 'Test suite completed');
});