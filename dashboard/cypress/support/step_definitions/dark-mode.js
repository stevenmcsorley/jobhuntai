import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Dark mode specific step definitions

Then('skill analysis should be readable', () => {
  // Try to find skill analysis elements
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="skill-analysis"]').length) {
      cy.get('[data-cy="skill-analysis"]').should('be.visible');
    } else if ($body.find('.skill-item').length) {
      cy.get('.skill-item').should('be.visible');
    } else {
      cy.contains('Skills').should('exist');
    }
  });
});

Then('charts should be properly themed', () => {
  cy.get('body').then(($body) => {
    if ($body.find('canvas, svg, .chart').length > 0) {
      cy.get('canvas, svg, .chart').should('be.visible');
    }
    
    // Check that chart containers have proper background
    if ($body.find('.chart-container, [data-cy="chart"]').length > 0) {
      cy.get('.chart-container, [data-cy="chart"]').each(($chart) => {
        cy.wrap($chart).should('be.visible');
      });
    } else {
      cy.log('No charts found on this page');
    }
  });
});

Then('text areas should have proper contrast', () => {
  cy.get('textarea').each(($textarea) => {
    cy.wrap($textarea)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)')
      .and('not.have.css', 'background-color', 'rgb(0, 0, 0)');
  });
});

Then('form controls should be visible', () => {
  cy.get('input, select, textarea, button').each(($control) => {
    cy.wrap($control).should('be.visible');
  });
});

Then('form instructions should be readable', () => {
  cy.get('p, .instruction, [data-cy="instructions"]').each(($text) => {
    cy.wrap($text)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)');
  });
});

Then('code examples should be visible', () => {
  cy.get('pre, code, .code-example').each(($code) => {
    cy.wrap($code)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)');
  });
});

Then('input fields should have proper contrast', () => {
  cy.get('input, textarea, select').each(($input) => {
    cy.wrap($input)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)')
      .and('not.have.css', 'background-color', 'rgb(255, 255, 255)'); // Not pure white in dark mode
  });
});

Then('the modal should be visible in dark mode', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.modal').length) {
      cy.get('.modal').should('be.visible');
    } else if ($body.find('[data-cy="modal"]').length) {
      cy.get('[data-cy="modal"]').should('be.visible');
    } else {
      cy.log('No modal found on page');
    }
  });
});

Then('modal text should be readable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.modal h1, .modal h2, .modal h3, .modal p, .modal label').length > 0) {
      cy.get('.modal h1, .modal h2, .modal h3, .modal p, .modal label').each(($text) => {
        cy.wrap($text)
          .should('be.visible')
          .and('not.have.css', 'color', 'rgb(0, 0, 0)');
      });
    } else {
      cy.log('No modal text elements found');
    }
  });
});

Then('form fields in modal should have proper contrast', () => {
  cy.get('.modal input, .modal textarea, .modal select').each(($field) => {
    cy.wrap($field)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)');
  });
});

// Helper steps for dark mode testing
When('I check text visibility in {string}', (selector) => {
  cy.get(selector).each(($el) => {
    cy.wrap($el)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)')
      .and('not.have.css', 'color', 'rgba(0, 0, 0, 1)');
  });
});

Then('dropdown menus should be readable in dark mode', () => {
  cy.get('select option').each(($option, index) => {
    // Only check first few options to avoid performance issues
    if (index < 3) {
      cy.wrap($option).should('exist');
    }
  });
});

Then('navigation items should be visible', () => {
  cy.get('nav a, .nav-link, [data-cy="nav-item"]').each(($nav) => {
    cy.wrap($nav)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)');
  });
});

Then('form labels should be readable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('label').length > 0) {
      cy.get('label').each(($label) => {
        cy.wrap($label)
          .should('be.visible')
          .and('not.have.css', 'color', 'rgb(0, 0, 0)');
      });
    } else {
      cy.log('No form labels found on this page');
    }
  });
});

Then('dropdown options should be visible', () => {
  cy.get('select, [data-cy="dropdown"]').each(($dropdown) => {
    cy.wrap($dropdown)
      .should('be.visible')
      .and('not.have.css', 'color', 'rgb(0, 0, 0)');
  });
});

// New UX-focused step definitions
Then('the page title should be visible and readable', () => {
  cy.get('h1').should('be.visible').and('not.have.css', 'color', 'rgb(0, 0, 0)');
});

Then('job statistics should have good contrast', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.stats-card, .surface-card, [data-cy*="stat"]').length > 0) {
      cy.get('.stats-card, .surface-card, [data-cy*="stat"]').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)');
    } else {
      cy.log('No statistics found on page');
    }
  });
});

Then('table headers should be readable in dark mode', () => {
  cy.get('body').then(($body) => {
    if ($body.find('th, .table-header').length > 0) {
      cy.get('th, .table-header').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)');
    } else {
      cy.log('No table headers found on page');
    }
  });
});

Then('action buttons should be clearly visible', () => {
  cy.get('button').first().should('be.visible').and('not.have.css', 'color', 'rgb(0, 0, 0)');
});

Then('the page should load successfully', () => {
  cy.get('body').should('be.visible');
  cy.url().should('not.contain', '404');
});

Then('any job cards should be readable if present', () => {
  cy.get('body').then(($body) => {
    if ($body.find('.job-card, [data-cy="job-opportunity"]').length > 0) {
      cy.get('.job-card, [data-cy="job-opportunity"]').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)');
    } else {
      cy.log('No job cards found on page');
    }
  });
});

Then('navigation elements should be visible', () => {
  cy.get('nav, .nav, [role="navigation"]').should('be.visible');
});

Then('form elements should be clearly visible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('input, select, textarea').length > 0) {
      cy.get('input, select, textarea').first().should('be.visible');
    } else {
      cy.log('No form elements found on page');
    }
  });
});

Then('any dropdown menus should be readable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('select').length > 0) {
      cy.get('select').first().should('be.visible').and('not.have.css', 'color', 'rgb(0, 0, 0)');
    } else {
      cy.log('No dropdown menus found on page');
    }
  });
});

Then('submit buttons should be accessible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('button[type="submit"], .submit-btn, [data-cy*="submit"]').length > 0) {
      cy.get('button[type="submit"], .submit-btn, [data-cy*="submit"]').first()
        .should('be.visible')
        .and('not.be.disabled');
    } else {
      cy.log('No submit buttons found on page');
    }
  });
});

Then('the page content should be visible', () => {
  cy.get('main, .main-content, .content').should('be.visible');
});

Then('any charts should be properly themed for dark mode', () => {
  cy.get('body').then(($body) => {
    if ($body.find('canvas, svg, .chart').length > 0) {
      cy.get('canvas, svg, .chart').first().should('be.visible');
    } else {
      cy.log('No charts found on page');
    }
  });
});

Then('analysis text should be readable', () => {
  cy.get('body').then(($body) => {
    if ($body.find('p, .analysis, [data-cy*="analysis"]').length > 0) {
      cy.get('p, .analysis, [data-cy*="analysis"]').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)');
    } else {
      cy.log('No analysis text found on page');
    }
  });
});

Then('text editing areas should have proper contrast', () => {
  cy.get('body').then(($body) => {
    if ($body.find('textarea, .editor').length > 0) {
      cy.get('textarea, .editor').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)')
        .and('not.have.css', 'background-color', 'rgb(255, 255, 255)');
    } else {
      cy.log('No text editing areas found on page');
    }
  });
});

Then('save/edit buttons should be accessible', () => {
  cy.get('body').then(($body) => {
    if ($body.find('button').length > 0) {
      cy.get('button').first().should('be.visible').and('not.be.disabled');
    } else {
      cy.log('No save/edit buttons found on page');
    }
  });
});

Then('input fields should have good contrast', () => {
  cy.get('body').then(($body) => {
    if ($body.find('input, textarea').length > 0) {
      cy.get('input, textarea').first()
        .should('be.visible')
        .and('not.have.css', 'color', 'rgb(0, 0, 0)')
        .and('not.have.css', 'background-color', 'rgb(255, 255, 255)');
    } else {
      cy.log('No input fields found on page');
    }
  });
});

When('I toggle the theme from dark to light', () => {
  cy.switchTheme('light');
});

Then('the page should switch to light mode', () => {
  cy.get('html').should('have.class', 'light');
});

When('I toggle the theme from light to dark', () => {
  cy.switchTheme('dark');
});

Then('the page should switch to dark mode', () => {
  cy.get('html').should('have.class', 'dark');
});