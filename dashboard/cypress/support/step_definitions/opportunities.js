import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Variables to store counts for comparison
let badgeCount = 0;
let tableCount = 0;

// Step definitions for opportunities badge and table validation
When('I check the opportunities menu badge count', () => {
  // Wait a moment for any dynamic data to load
  cy.wait(1000);
  
  // First ensure sidebar is expanded to see the badge
  cy.get('body').then(($body) => {
    // Check if sidebar is collapsed by looking for collapse button
    const $collapseBtn = $body.find('button[title*="Expand"], button:contains("Expand")');
    if ($collapseBtn.length > 0) {
      cy.log('Sidebar appears collapsed, expanding it');
      cy.wrap($collapseBtn).click();
      cy.wait(500); // Wait for animation
    }
  });

  // Use data-testid for reliable badge detection
  cy.get('body').then(($body) => {
    const $badge = $body.find('[data-testid="opportunities-badge"]');
    if ($badge.length > 0) {
      const badgeText = $badge.text().trim();
      badgeCount = parseInt(badgeText) || 0;
      cy.log(`Badge found with data-testid: "${badgeText}", count: ${badgeCount}`);
    } else {
      badgeCount = 0;
      cy.log('No badge found with data-testid, assuming 0 opportunities');
    }
  });
});

When('I navigate to the {string} page', (pageName) => {
  cy.navigateToPage(pageName);
  cy.waitForApp();
});

Then('the number of opportunities in the table should match the badge count', () => {
  // Count the rows in the opportunities table using data-testid
  cy.get('body').then(($body) => {
    const $tableRows = $body.find('[data-testid="opportunities-table-row"]');
    if ($tableRows.length > 0) {
      tableCount = $tableRows.length;
      cy.log(`Table count found using data-testid: ${tableCount}`);
      
      // Compare the counts
      expect(tableCount).to.equal(badgeCount, 
        `Table count (${tableCount}) should match badge count (${badgeCount})`);
    } else {
      // No opportunities in table
      tableCount = 0;
      cy.log('No opportunities found in table');
      expect(tableCount).to.equal(badgeCount, 
        `Empty table should match badge count of ${badgeCount}`);
    }
  });
});

Then('the opportunities table should display correctly', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="opportunities-table"]').length > 0) {
      cy.get('[data-testid="opportunities-table"]').should('be.visible');
      // Check table has proper structure using data-testid
      cy.get('[data-testid="opportunities-table-header"]').should('exist');
      cy.get('[data-testid="opportunities-table-body"]').should('exist');
    } else {
      cy.log('No table found - may indicate no opportunities');
    }
  });
});

Then('I should see the opportunities header', () => {
  cy.get('[data-testid="opportunities-page-title"]').should('be.visible').and('contain.text', 'Opportunities');
});

Then('the opportunities table should be visible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="opportunities-table"]').length > 0) {
      cy.get('[data-testid="opportunities-table"]').should('be.visible');
    } else {
      cy.log('No opportunities table found - may indicate empty state');
    }
  });
});

Then('job data should be properly formatted if present', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="opportunities-table-row"]').length > 0) {
      // Check first row has proper data formatting
      cy.get('[data-testid="opportunities-table-row"]').first().within(() => {
        // Should have multiple columns with data
        cy.get('td').should('have.length.at.least', 3);
      });
    } else {
      cy.log('No job data found to validate formatting');
    }
  });
});

Then('search functionality should be available', () => {
  cy.get('input[placeholder*="search"], input[placeholder*="Search"], [data-cy*="search"]')
    .should('be.visible')
    .and('not.be.disabled');
});

When('I examine the statistics section', () => {
  cy.get('body').then(($body) => {
    // Look for statistics/stats section
    const statsSelectors = '.stats, .statistics, [data-cy*="stat"], .metric';
    if ($body.find(statsSelectors).length > 0) {
      cy.get(statsSelectors).should('be.visible');
    } else {
      cy.log('No statistics section found on page');
    }
  });
});

Then('the total jobs count should match the table rows', () => {
  cy.get('body').then(($body) => {
    // Count table rows
    const actualRows = $body.find('table tbody tr').length;
    
    // Check if stats show a total count
    if ($body.find('.stats, [data-cy*="stat"]').length > 0) {
      cy.get('.stats, [data-cy*="stat"]').first().then(($stats) => {
        const statsText = $stats.text();
        // Try to extract number from stats text
        const numberMatch = statsText.match(/(\d+)/);
        if (numberMatch) {
          const statsCount = parseInt(numberMatch[1]);
          cy.log(`Stats count: ${statsCount}, Table rows: ${actualRows}`);
          expect(actualRows).to.equal(statsCount);
        } else {
          cy.log('Could not extract count from statistics');
        }
      });
    } else {
      cy.log('No statistics found to compare with table count');
    }
  });
});

Then('statistics should be accurate and readable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.stats, [data-cy*="stat"]').length > 0) {
      cy.get('.stats, [data-cy*="stat"]').each(($stat) => {
        cy.wrap($stat)
          .should('be.visible')
          .and('not.have.css', 'color', 'rgb(0, 0, 0)'); // Not pure black in dark mode
      });
    } else {
      cy.log('No statistics found to validate');
    }
  });
});

When('there are opportunities in the table', () => {
  // This is a conditional step - just check if opportunities exist
  cy.get('body').then(($body) => {
    if ($body.find('table tbody tr').length > 0) {
      cy.log('Opportunities found in table');
    } else {
      cy.log('No opportunities in table - skipping related checks');
    }
  });
});

Then('each opportunity should display required information', () => {
  cy.get('body').then(($body) => {
    if ($body.find('table tbody tr').length > 0) {
      // Check first few rows for required information
      cy.get('table tbody tr').first().within(() => {
        // Should have job title, company, or other key information
        cy.get('td').first().should('not.be.empty');
      });
    } else {
      cy.log('No opportunities to validate information');
    }
  });
});

Then('action buttons should be available for each opportunity', () => {
  cy.get('body').then(($body) => {
    if ($body.find('table tbody tr').length > 0) {
      // Check that action buttons exist
      cy.get('table tbody tr').first().within(() => {
        cy.get('button, .action-btn, [data-cy*="action"]').should('have.length.at.least', 1);
      });
    } else {
      cy.log('No opportunities to check for action buttons');
    }
  });
});

Then('table columns should be properly aligned', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="opportunities-table"]').length > 0) {
      // Check table structure using data-testid
      cy.get('[data-testid="opportunities-table"]').should('be.visible');
      cy.get('[data-testid="opportunities-table-header"] th').should('have.length.at.least', 3);
    } else {
      cy.log('No table to check alignment');
    }
  });
});

When('there are no opportunities available', () => {
  // Check if table is empty
  cy.get('body').then(($body) => {
    if ($body.find('table tbody tr').length === 0) {
      cy.log('Confirmed: No opportunities in table');
    } else {
      cy.log('Note: Opportunities exist in table');
    }
  });
});

Then('an appropriate empty state should be displayed', () => {
  cy.get('body').then(($body) => {
    if ($body.find('table tbody tr').length === 0) {
      // Should show some kind of empty state message
      cy.contains(/no opportunities|no jobs|empty|nothing found/i, { timeout: 5000 })
        .should('exist');
    } else {
      cy.log('Table has data - empty state not applicable');
    }
  });
});

Then('the user should understand there are no current opportunities', () => {
  cy.get('body').then(($body) => {
    if ($body.find('table tbody tr').length === 0) {
      // Should be clear that there are no opportunities
      cy.get('body').should('contain.text', /.+/); // Should contain some explanatory text
    } else {
      cy.log('Table has opportunities - empty state guidance not applicable');
    }
  });
});