// Import Cypress commands
import './commands';

// Import only auth-specific step definitions
import './step_definitions/auth_steps';

// Import Cypress plugins
import 'cypress-real-events';

// Global before hook for all tests
before(() => {
  // Clear any existing data
  cy.task('log', 'Starting authentication test suite');
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
  // Capture screenshot after each test for analysis
  cy.screenshot({ capture: 'fullPage', overwrite: true });
});

// Global after hook
after(() => {
  cy.task('log', 'Authentication test suite completed');
});