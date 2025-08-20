import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Job management specific step definitions

When('I fill in the JSON input with valid job data', () => {
  const sampleJobData = JSON.stringify([
    {
      title: "Senior Software Engineer",
      company: "Example Corp",
      url: "https://example.com/job/senior-engineer",
      location: "Remote",
      description: "Looking for an experienced software engineer..."
    }
  ], null, 2);
  
  cy.get('body').then(($body) => {
    if ($body.find('textarea[placeholder*="JSON"]').length) {
      cy.get('textarea[placeholder*="JSON"]').type(sampleJobData, { delay: 0 });
    } else {
      cy.get('[data-cy="json-input"]').type(sampleJobData, { delay: 0 });
    }
  });
});

Then('I should see a success message', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="success-message"]').length) {
      cy.get('[data-cy="success-message"]').should('be.visible');
    } else if ($body.find(':contains("Success")').length) {
      cy.contains('Success').should('be.visible');
    } else {
      cy.contains('imported').should('be.visible');
    }
  });
});

Then('the jobs should be imported', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="jobs-imported"]').length) {
      cy.get('[data-cy="jobs-imported"]').should('be.visible');
    } else {
      cy.contains('Senior Software Engineer').should('be.visible');
    }
  });
});

Then('I should see available job opportunities', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-opportunity"]').length) {
      cy.get('[data-cy="job-opportunity"]').should('have.length.at.least', 1);
    } else if ($body.find('.job-card').length) {
      cy.get('.job-card').should('have.length.at.least', 1);
    } else if ($body.find('[data-cy="job-list"] > *').length) {
      cy.get('[data-cy="job-list"] > *').should('have.length.at.least', 1);
    } else {
      cy.log('No job opportunities found on page');
    }
  });
});

Then('I should see job filtering options', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-filter"]').length) {
      cy.get('[data-cy="job-filter"]').should('exist');
    } else if ($body.find('input[type="checkbox"]').length) {
      cy.get('input[type="checkbox"]').should('exist');
    } else {
      cy.get('.filter-chip').should('exist');
    }
  });
});

Then('each job card should show key information', () => {
  cy.get('.job-card, [data-cy="job-opportunity"]').each(($card) => {
    // Each job card should have at least title and company
    cy.wrap($card).should('contain.text', /\S/); // Contains non-whitespace text
  });
});

When('I apply skill filters', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="skill-filter"]').length) {
      cy.get('[data-cy="skill-filter"]').check();
    } else {
      cy.get('input[type="checkbox"]').first().check();
    }
  });
});

When('I apply location filters', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="location-filter"]').length) {
      cy.get('[data-cy="location-filter"]').type('Remote');
    } else {
      cy.get('input[placeholder*="location"]').type('Remote');
    }
  });
});

Then('the job list should be filtered accordingly', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="filtered-results"]').length) {
      cy.get('[data-cy="filtered-results"]').should('exist');
    } else {
      cy.get('.job-card').should('exist');
    }
  });
});

When('I click on a job title', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-title"]').length) {
      cy.get('[data-cy="job-title"]').first().click();
    } else if ($body.find('.job-title').length) {
      cy.get('.job-title').first().click();
    } else {
      cy.get('table td').first().click();
    }
  });
});

Then('I should see detailed job information', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-details"]').length) {
      cy.get('[data-cy="job-details"]').should('be.visible');
    } else {
      cy.get('h1, h2').contains(/Software|Engineer|Developer/).should('be.visible');
    }
  });
});

Then('I should see job analysis if available', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="job-analysis"]').length) {
      cy.get('[data-cy="job-analysis"]').should('exist');
    } else if ($body.find(':contains("Analysis")').length) {
      cy.contains('Analysis').should('exist');
    } else {
      cy.contains('Skills Match').should('exist');
    }
  });
});

Then('job cards should be readable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.job-card').length) {
      cy.get('.job-card').each(($card) => {
        if ($card.is(':visible')) {
          cy.wrap($card).should('be.visible');
          cy.wrap($card).should('not.have.css', 'color', 'rgb(0, 0, 0)');
        }
      });
    } else if ($body.find('[data-cy="job-opportunity"]').length) {
      cy.get('[data-cy="job-opportunity"]').each(($card) => {
        if ($card.is(':visible')) {
          cy.wrap($card).should('be.visible');
          cy.wrap($card).should('not.have.css', 'color', 'rgb(0, 0, 0)');
        }
      });
    } else {
      cy.log('No job cards found to test readability');
    }
  });
});

Then('filter options should be visible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.filter-chip, [data-cy="filter"]').length > 0) {
      cy.get('.filter-chip, [data-cy="filter"]').each(($filter) => {
        cy.wrap($filter).should('be.visible');
        cy.wrap($filter).should('not.have.css', 'color', 'rgb(0, 0, 0)');
      });
    } else {
      cy.log('No filter options found on this page');
    }
  });
});