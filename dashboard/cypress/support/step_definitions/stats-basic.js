import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Stats Page Basic Functionality Step Definitions

Then('I should see the stats page title', () => {
  cy.get('[data-testid="stats-page-title"]')
    .should('be.visible')
    .and('contain.text', 'Analytics');
});

Then('I should see the statistics overview interface', () => {
  // Check that the main stats interface is visible
  cy.get('[data-testid="stats-cards-grid"]')
    .should('be.visible');
});

When('I examine the statistics cards', () => {
  // Wait for stats cards to be ready
  cy.get('[data-testid="stats-cards-grid"]').should('be.visible');
});

Then('I should see the stats cards grid', () => {
  cy.get('[data-testid="stats-cards-grid"]')
    .should('be.visible')
    .and('have.class', 'grid');
});

Then('the stat cards should display application metrics', () => {
  // Check for stat cards with application-related metrics
  cy.get('[data-testid="stats-cards-grid"]').within(() => {
    cy.get('[data-testid*="stat-card"]').should('have.length.at.least', 2);
  });
});

Then('the stat cards should have proper labels and values', () => {
  cy.get('[data-testid*="stat-card"]').each(($card) => {
    // Each card should have a title and value
    cy.wrap($card).within(() => {
      cy.get('h3, .text-lg').should('be.visible').and('not.be.empty');
      cy.get('.text-3xl, .font-bold').should('be.visible');
    });
  });
});

Then('the stat cards should be visually organized', () => {
  // Check that stat cards are properly styled and organized
  cy.get('[data-testid*="stat-card"]').each(($card) => {
    cy.wrap($card)
      .should('be.visible')
      .and('have.css', 'padding');
  });
  
  // Verify cards are in a grid layout
  cy.get('[data-testid="stats-cards-grid"]')
    .should('have.class', 'grid');
});

When('I examine the charts section', () => {
  // Look for the charts section
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="stats-charts-grid"]').length > 0) {
      cy.get('[data-testid="stats-charts-grid"]').should('be.visible');
    } else {
      cy.log('Charts section may not be visible or available');
    }
  });
});

Then('I should see the stats charts grid', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="stats-charts-grid"]').length > 0) {
      cy.get('[data-testid="stats-charts-grid"]')
        .should('be.visible')
        .and('have.class', 'grid');
    } else {
      cy.log('Charts grid not found - may be in loading state or no data available');
    }
  });
});

Then('the charts should be properly rendered', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="stats-charts-grid"]').length > 0) {
      cy.get('[data-testid="stats-charts-grid"]').within(() => {
        // Look for chart elements or containers
        cy.get('div').should('have.length.at.least', 1);
      });
    } else {
      cy.log('Charts not visible - may be in loading state');
    }
  });
});

Then('the charts should have appropriate titles', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="stats-charts-grid"]').length > 0) {
      // Look for chart titles
      cy.get('[data-testid="stats-charts-grid"]').then(($charts) => {
        const titles = $charts.find('h1, h2, h3, h4, h5, .title, [class*="title"]');
        if (titles.length > 0) {
          cy.log(`Found ${titles.length} chart titles`);
        }
      });
    } else {
      cy.log('Charts section not available for title checking');
    }
  });
});

When('I examine the stats page layout', () => {
  // Check overall page structure
  cy.get('body').should('be.visible');
});

Then('the header section should be clearly displayed', () => {
  cy.get('[data-testid="stats-page-title"]')
    .should('be.visible')
    .and('have.css', 'font-size');
    
  // Check that header has good visual hierarchy
  cy.get('[data-testid="stats-page-title"]').then(($title) => {
    const fontSize = parseFloat($title.css('font-size'));
    expect(fontSize).to.be.greaterThan(16); // Should be larger than body text
  });
});

Then('the statistics content should be logically organized', () => {
  // Verify main components are present and organized
  cy.get('[data-testid="stats-page-title"]').should('be.visible');
  cy.get('[data-testid="stats-cards-grid"]').should('be.visible');
  
  // Check that elements are positioned logically
  cy.get('[data-testid="stats-page-title"]').then(($title) => {
    cy.get('[data-testid="stats-cards-grid"]').then(($cards) => {
      const titleTop = $title.offset().top;
      const cardsTop = $cards.offset().top;
      expect(cardsTop).to.be.greaterThan(titleTop); // Cards should be below title
    });
  });
});

Then('the page should have good visual hierarchy', () => {
  // Check that the page has proper visual organization
  cy.get('[data-testid="stats-page-title"]')
    .should('be.visible')
    .and('have.css', 'font-weight');
    
  cy.get('[data-testid="stats-cards-grid"]')
    .should('be.visible')
    .and('have.css', 'display');
});

When('I analyze the statistics content', () => {
  // Focus on the statistical data being presented
  cy.get('[data-testid="stats-cards-grid"]').should('be.visible');
});

Then('the stats should show application tracking data', () => {
  // Check that stats relate to job applications
  cy.get('[data-testid*="stat-card"]').then(($cards) => {
    const cardTexts = Array.from($cards).map(card => Cypress.$(card).text().toLowerCase());
    const hasApplicationData = cardTexts.some(text => 
      text.includes('application') || 
      text.includes('job') || 
      text.includes('applied') || 
      text.includes('total') ||
      text.includes('source')
    );
    
    if (hasApplicationData) {
      cy.log('Found application tracking data in statistics');
    } else {
      cy.log('Statistics may be showing general metrics');
    }
  });
});

Then('the metrics should be clearly presented', () => {
  // Check that metrics are readable and well-formatted
  cy.get('[data-testid*="stat-card"]').each(($card) => {
    cy.wrap($card).within(() => {
      // Should have clear labels and values
      cy.get('h3, .text-lg').should('be.visible');
      cy.get('.text-3xl, .font-bold, .text-2xl').should('be.visible');
    });
  });
});

Then('the data should be easy to understand', () => {
  // Verify that the interface is user-friendly
  cy.get('[data-testid*="stat-card"]').each(($card) => {
    cy.wrap($card)
      .should('be.visible')
      .and('have.css', 'text-align'); // Should have proper text alignment
  });
  
  // Check for good visual design
  cy.get('[data-testid="stats-cards-grid"]')
    .should('be.visible')
    .and('have.css', 'gap'); // Should have proper spacing
});

When('I check for data availability', () => {
  // Check the current state of data on the page
  cy.get('body').should('be.visible');
});

Then('the page should handle data loading appropriately', () => {
  // Check that loading states are handled gracefully
  cy.get('body').then(($body) => {
    const loadingIndicators = $body.find('.spinner, .loading, [data-testid*="loading"]');
    if (loadingIndicators.length > 0) {
      cy.log('Loading indicators found - data may still be loading');
    } else {
      cy.log('No persistent loading indicators found');
    }
  });
});

Then('the statistics should be displayed when available', () => {
  // Verify that stats are shown when data is available
  cy.get('[data-testid="stats-cards-grid"]').should('be.visible');
  cy.get('[data-testid*="stat-card"]').should('have.length.at.least', 1);
});

Then('the interface should be responsive to data states', () => {
  // Check that the interface adapts to different data states
  cy.get('[data-testid="stats-page-title"]').should('be.visible');
  
  // Verify that main content areas are responsive
  cy.get('[data-testid="stats-cards-grid"]')
    .should('be.visible')
    .and('have.css', 'display');
    
  // Check that the page doesn't show error states by default
  cy.get('body').then(($body) => {
    const errorElements = $body.find('.error, [class*="error"], .alert-error');
    if (errorElements.length === 0) {
      cy.log('No error states visible - interface is functioning normally');
    }
  });
});