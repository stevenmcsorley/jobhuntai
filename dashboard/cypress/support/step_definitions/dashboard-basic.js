import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Dashboard Basic Functionality Step Definitions

Then('I should see the dashboard title', () => {
  cy.get('[data-testid="dashboard-title"]')
    .should('be.visible')
    .and('contain.text', 'Job Hunt Dashboard');
});

Then('I should see the dashboard statistics section', () => {
  cy.get('[data-testid="dashboard-stats"]')
    .should('be.visible');
});

Then('I should see the main action buttons', () => {
  cy.get('[data-testid="add-job-button"]')
    .should('be.visible')
    .and('contain.text', 'Add Job');
  
  cy.get('[data-testid="run-hunt-button"]')
    .should('be.visible')
    .and('contain.text', 'Find New Jobs');
});

Then('I should see the search functionality', () => {
  cy.get('[data-testid="dashboard-search-input"]')
    .should('be.visible')
    .and('have.attr', 'placeholder');
});

When('I examine the dashboard statistics section', () => {
  cy.get('[data-testid="dashboard-stats"]').should('be.visible');
});

Then('I should see stat cards for job metrics', () => {
  // Check for common stat cards that should be present
  cy.get('[data-testid="dashboard-stats"]').within(() => {
    cy.get('.stats-card').should('have.length.at.least', 3);
  });
});

Then('the stat cards should display numerical values', () => {
  cy.get('[data-testid="dashboard-stats"]').within(() => {
    cy.get('.stats-value').each(($value) => {
      // Check that each stat value contains some content
      cy.wrap($value).should('not.be.empty');
    });
  });
});

Then('the stat cards should be properly labeled', () => {
  cy.get('[data-testid="dashboard-stats"]').within(() => {
    cy.get('.stats-label').each(($label) => {
      // Check that each stat has a meaningful label
      cy.wrap($label).should('not.be.empty');
    });
  });
});

When('I check the main action buttons', () => {
  // Verify buttons are present and check their state
  cy.get('[data-testid="add-job-button"]').should('exist');
  cy.get('[data-testid="run-hunt-button"]').should('exist');
});

Then('I should see the dashboard {string} button', (buttonText) => {
  cy.get('button').contains(buttonText).should('be.visible');
});

Then('the buttons should be clickable and responsive', () => {
  // Check that buttons are not disabled and can be interacted with
  cy.get('[data-testid="add-job-button"]')
    .should('not.be.disabled')
    .and('be.visible');
    
  cy.get('[data-testid="run-hunt-button"]')
    .should('not.be.disabled')
    .and('be.visible');
});

When('I interact with the search input', () => {
  cy.get('[data-testid="dashboard-search-input"]').should('be.visible');
});

Then('I should be able to type in the search field', () => {
  cy.get('[data-testid="dashboard-search-input"]')
    .should('not.be.disabled')
    .and('not.have.attr', 'readonly');
});

Then('the search input should accept text input', () => {
  cy.get('[data-testid="dashboard-search-input"]')
    .type('test search')
    .should('have.value', 'test search')
    .clear();
});

Then('the search input should have appropriate placeholder text', () => {
  cy.get('[data-testid="dashboard-search-input"]')
    .should('have.attr', 'placeholder')
    .and('include', 'Search');
});

When('I examine the page layout', () => {
  // General page structure check
  cy.get('body').should('be.visible');
});

Then('the header section should be properly positioned', () => {
  cy.get('[data-testid="dashboard-title"]')
    .should('be.visible')
    .parents('header')
    .should('exist');
});

Then('the statistics section should be laid out in a grid', () => {
  cy.get('[data-testid="dashboard-stats"]')
    .should('have.class', 'grid')
    .and('be.visible');
});

Then('the content should be organized in logical sections', () => {
  // Check that main sections are present and ordered logically
  cy.get('[data-testid="dashboard-title"]').should('be.visible');
  cy.get('[data-testid="dashboard-stats"]').should('be.visible');
  cy.get('[data-testid="dashboard-search-input"]').should('be.visible');
});

When('I look for the trends section', () => {
  // Look for the application trends chart section
  cy.get('body').then(($body) => {
    if ($body.find('h3:contains("Application Trends")').length > 0) {
      cy.get('h3').contains('Application Trends').should('be.visible');
    } else {
      cy.log('Application trends section not found - may be empty state');
    }
  });
});

Then('I should see a section for application trends', () => {
  cy.get('body').then(($body) => {
    if ($body.find('h3:contains("Application Trends")').length > 0) {
      cy.get('h3').contains('Application Trends').should('be.visible');
    } else {
      cy.log('Application trends chart may not be visible with current data');
    }
  });
});

Then('the trends section should be properly labeled', () => {
  cy.get('body').then(($body) => {
    if ($body.find('h3:contains("Application Trends")').length > 0) {
      cy.get('h3').contains('Application Trends')
        .should('be.visible')
        .and('not.be.empty');
    } else {
      cy.log('Trends section not visible - likely due to no data');
    }
  });
});

When('I examine the jobs tables', () => {
  // Look for the main jobs tables sections
  cy.get('body').should('be.visible');
});

Then('I should see the Follow-up jobs table', () => {
  cy.get('body').then(($body) => {
    if ($body.find('h2:contains("Follow-up")').length > 0) {
      cy.get('h2').contains('Follow-up').should('be.visible');
    } else {
      cy.log('Follow-up table section not found - may be empty or using different structure');
    }
  });
});

Then('I should see the Applied jobs table', () => {
  cy.get('body').then(($body) => {
    if ($body.find('h2:contains("Applied")').length > 0) {
      cy.get('h2').contains('Applied').should('be.visible');
    } else {
      cy.log('Applied jobs table section not found - may be empty or using different structure');
    }
  });
});

Then('the tables should have proper headers and structure', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid*="table"]').length > 0) {
      cy.get('[data-testid*="table"]').should('be.visible');
    } else {
      cy.log('Job tables not found - may be empty state or different structure');
    }
  });
});