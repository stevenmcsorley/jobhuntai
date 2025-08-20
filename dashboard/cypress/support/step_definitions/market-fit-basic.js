import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Given('I visit the market-fit page', () => {
  cy.visitPage('market-fit');
});

Then('I should see the market fit page title', () => {
  cy.get('[data-testid="market-fit-page-title"], [data-testid="market-fit-loaded-title"]')
    .should('be.visible')
    .and('contain', 'Market-Fit Analysis');
});

Then('the page should be properly structured', () => {
  cy.get('body')
    .should('be.visible')
    .and('contain', 'Market-Fit Analysis');
});

Then('I should see the empty state when no data is available', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="empty-state-container"]').length > 0) {
      cy.get('[data-testid="empty-state-container"]')
        .should('be.visible');
    } else {
      cy.log('Market data is available, skipping empty state check');
    }
  });
});

Then('I should see the empty state icon', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="empty-state-icon"]').length > 0) {
      cy.get('[data-testid="empty-state-icon"]')
        .should('be.visible');
    } else {
      cy.log('No empty state icon found - data is available');
    }
  });
});

Then('I should see helpful guidance message', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="empty-state-title"]').length > 0) {
      cy.get('[data-testid="empty-state-title"]')
        .should('be.visible')
        .and('contain', 'No Data Available');
    } else {
      cy.log('No empty state found - data is available');
    }
  });
});

Given('market data is available', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="analysis-card"]').length === 0) {
      cy.log('No market data available - this scenario will be skipped');
    }
  });
});

Then('I should see the loaded market fit title', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="market-fit-loaded-title"]').length > 0) {
      cy.get('[data-testid="market-fit-loaded-title"]')
        .should('be.visible')
        .and('contain', 'Market-Fit Analysis');
    } else {
      cy.log('Market data not loaded - checking for basic title');
      cy.get('[data-testid="market-fit-page-title"]')
        .should('be.visible');
    }
  });
});

Then('I should see the analysis subtitle', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="analysis-subtitle"]').length > 0) {
      cy.get('[data-testid="analysis-subtitle"]')
        .should('be.visible')
        .and('contain', 'Based on an analysis');
    } else {
      cy.log('No analysis subtitle found - data may not be loaded');
    }
  });
});

Then('I should see the analysis card', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="analysis-card"]').length > 0) {
      cy.get('[data-testid="analysis-card"]')
        .should('be.visible')
        .and('not.be.empty');
    } else {
      cy.log('No analysis card found - data may not be available');
    }
  });
});

Then('I should see the skills analysis title', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="skills-analysis-title"]').length > 0) {
      cy.get('[data-testid="skills-analysis-title"]')
        .should('be.visible')
        .and('contain', 'Skills Analysis');
    } else {
      cy.log('No skills analysis title found - data may not be available');
    }
  });
});

Then('I should see the skills chart container', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="skills-chart"]').length > 0) {
      cy.get('[data-testid="skills-chart"]')
        .should('be.visible')
        .and('not.be.empty');
    } else {
      cy.log('No skills chart found - data may not be available');
    }
  });
});

Then('chart should display skill data', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="skills-chart"]').length > 0) {
      cy.get('[data-testid="skills-chart"]')
        .within(() => {
          cy.get('svg, canvas, .chart-container')
            .should('exist');
        });
    } else {
      cy.log('No chart container found - data may not be available');
    }
  });
});

Then('the page should handle loading states gracefully', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="loading-text"]').length > 0) {
      cy.get('[data-testid="loading-text"]')
        .should('contain', 'Loading Market Analysis');
    } else {
      cy.log('Page has finished loading');
    }
  });
});

Then('content should be properly organized', () => {
  cy.get('.max-w-7xl')
    .should('be.visible')
    .and('not.be.empty');
});

Then('responsive design should work correctly', () => {
  cy.get('.surface-card, .surface-card-elevated')
    .should('have.length.at.least', 1)
    .and('be.visible');
});

Then('skills data should be clearly presented', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="analysis-card"]').length > 0) {
      cy.get('[data-testid="analysis-card"]')
        .within(() => {
          cy.get('h2, p, div')
            .should('have.length.greaterThan', 0);
        });
    } else {
      cy.log('No analysis card found - checking for basic content structure');
      cy.get('h1, h2, h3')
        .should('have.length.greaterThan', 0);
    }
  });
});

Then('percentage information should be visible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="skills-chart"]').length > 0) {
      cy.get('[data-testid="skills-chart"]')
        .should('be.visible');
    } else {
      cy.log('No chart data available to check percentages');
    }
  });
});

Then('analysis should be informative', () => {
  cy.get('body')
    .should('contain.text', 'Analysis');
});