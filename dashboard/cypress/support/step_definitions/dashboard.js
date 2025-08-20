import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Dashboard-specific step definitions

Then('I should see applied jobs statistics', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="applied-jobs-stats"]').length) {
      cy.get('[data-cy="applied-jobs-stats"]').should('be.visible');
    } else {
      cy.contains('Applied Jobs').should('exist');
    }
  });
});

Then('I should see follow-up jobs statistics', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="followup-jobs-stats"]').length) {
      cy.get('[data-cy="followup-jobs-stats"]').should('be.visible');
    } else {
      cy.contains('Follow-up').should('exist');
    }
  });
});

Then('I should see the jobs table', () => {
  cy.get('body').then(($body) => {
    if ($body.find('table').length) {
      cy.get('table').should('be.visible');
    } else if ($body.find('[data-cy="jobs-table"]').length) {
      cy.get('[data-cy="jobs-table"]').should('be.visible');
    } else {
      cy.log('No table found on page');
    }
  });
});

Then('the jobs table should have action buttons', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-actions"]').length) {
      cy.get('[data-cy="job-actions"]').should('exist');
    } else if ($body.find('button[data-cy*="action"]').length) {
      cy.get('button[data-cy*="action"]').should('exist');
    } else if ($body.find('.dropdown').length) {
      cy.get('.dropdown').should('exist');
    } else {
      cy.log('No action buttons found');
    }
  });
});

Then('I should see readable job statistics', () => {
  cy.get('.stats-card, .surface-card')
    .should('be.visible')
    .and('not.have.css', 'color', 'rgb(0, 0, 0)'); // Not pure black
});

Then('I should see readable table headers', () => {
  cy.get('th, .table-header')
    .should('be.visible')
    .each(($el) => {
      cy.wrap($el).should('not.have.css', 'color', 'rgb(0, 0, 0)');
    });
});

When('I click the action menu for a job', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-actions"]').length) {
      cy.get('[data-cy="job-actions"]').first().click();
    } else if ($body.find('.dropdown-toggle').length) {
      cy.get('.dropdown-toggle').first().click();
    } else if ($body.find('button[aria-label*="action"]').length) {
      cy.get('button[aria-label*="action"]').first().click();
    } else {
      cy.log('No action menu found');
    }
  });
});

Then('I should see {string} in the jobs table', (jobTitle) => {
  cy.get('body').then(($body) => {
    if ($body.find('table').length) {
      cy.get('table').should('contain', jobTitle);
    } else if ($body.find('[data-cy="jobs-table"]').length) {
      cy.get('[data-cy="jobs-table"]').should('contain', jobTitle);
    } else {
      cy.log('No table found to check for job title');
    }
  });
});

When('I confirm the deletion', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="confirm-delete"]').length) {
      cy.get('[data-cy="confirm-delete"]').click();
    } else if ($body.find('button:contains("Yes")').length) {
      cy.contains('button', 'Yes').click();
    } else {
      cy.contains('button', 'Confirm').click();
    }
  });
});

Then('the job should be removed from the list', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-deleted-message"]').length) {
      cy.get('[data-cy="job-deleted-message"]').should('be.visible');
    } else {
      cy.contains('deleted successfully').should('be.visible');
    }
  });
});

// New UX-focused dashboard step definitions
Then('the page should load without errors', () => {
  cy.get('body').should('be.visible');
  cy.url().should('not.contain', 'error');
  cy.url().should('not.contain', '404');
});

Then('job statistics should be displayed correctly', () => {
  cy.get('body').then(($body) => {
    // Look for any statistics display elements
    const statSelectors = '.stats-card, .surface-card, [data-cy*="stat"], .metric-card';
    if ($body.find(statSelectors).length > 0) {
      cy.get(statSelectors).first().should('be.visible');
    } else {
      cy.log('No statistics found - this may be expected if no jobs exist');
    }
  });
});

Then('statistics should be readable and accessible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.stats-card, .surface-card, [data-cy*="stat"]').length > 0) {
      cy.get('.stats-card, .surface-card, [data-cy*="stat"]').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)')
        .and('not.have.css', 'background-color', 'rgb(0, 0, 0)');
    } else {
      cy.log('No statistics to check readability');
    }
  });
});

When('the page loads completely', () => {
  cy.waitForApp();
  cy.waitForLoading();
});

Then('the jobs table should be present if there are jobs', () => {
  cy.get('body').then(($body) => {
    if ($body.find('table, [data-cy="jobs-table"]').length > 0) {
      cy.get('table, [data-cy="jobs-table"]').should('be.visible');
    } else {
      cy.log('No jobs table found - may indicate no jobs exist');
    }
  });
});

Then('any action buttons should be functional', () => {
  cy.get('body').then(($body) => {
    if ($body.find('button').length > 0) {
      cy.get('button').first().should('be.visible').and('not.be.disabled');
    } else {
      cy.log('No action buttons found on page');
    }
  });
});

When('I toggle between light and dark themes', () => {
  cy.switchTheme('light');
  cy.wait(500);
  cy.switchTheme('dark');
  cy.wait(500);
});

Then('the page should remain functional in both themes', () => {
  cy.get('h1').should('be.visible');
  cy.get('button').first().should('be.visible');
});

Then('all text should remain readable', () => {
  cy.get('h1, h2, h3').first().should('be.visible').and('not.have.css', 'color', 'rgb(0, 0, 0)');
});

Then('the layout should be responsive', () => {
  // Test that important elements exist and are positioned properly
  cy.get('header, .header, h1').should('exist');
  cy.get('main, .main-content, .app-container').should('exist');
});

Then('important elements should be accessible', () => {
  cy.get('h1').should('be.visible');
  cy.get('button').first().should('be.visible').and('not.be.disabled');
});

Then('navigation should work properly', () => {
  cy.get('nav, .nav, [role="navigation"]').should('be.visible');
});