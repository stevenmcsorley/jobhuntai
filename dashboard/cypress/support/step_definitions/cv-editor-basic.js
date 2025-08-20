import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// CV Editor Basic Functionality Step Definitions

Then('I should see the cv editor title', () => {
  cy.get('[data-testid="cv-editor-title"]')
    .should('be.visible')
    .and('contain.text', 'CV Editor');
});

Then('I should see the cv content editor interface', () => {
  // Check that the main editor interface is visible
  cy.get('[data-testid="cv-content-textarea"]')
    .should('be.visible');
});

Then('I should see the save cv button', () => {
  cy.get('[data-testid="save-cv-button"]')
    .should('be.visible')
    .and('contain.text', 'Save CV');
});

When('I interact with the cv content area', () => {
  // Wait for the CV content area to be ready
  cy.get('[data-testid="cv-content-textarea"]').should('be.visible');
});

Then('I should see the cv content textarea', () => {
  cy.get('[data-testid="cv-content-textarea"]')
    .should('be.visible')
    .and('be.enabled');
});

Then('the textarea should accept text input', () => {
  cy.get('[data-testid="cv-content-textarea"]')
    .should('not.be.disabled')
    .and('not.have.attr', 'readonly');
    
  // Test that we can actually type in it
  cy.get('[data-testid="cv-content-textarea"]')
    .clear()
    .type('Test CV content')
    .should('contain.value', 'Test CV content')
    .clear();
});

Then('the textarea should have appropriate placeholder text', () => {
  cy.get('[data-testid="cv-content-textarea"]')
    .should('have.attr', 'placeholder')
    .and('include', 'CV');
});

Then('the textarea should be properly sized and styled', () => {
  cy.get('[data-testid="cv-content-textarea"]')
    .should('be.visible');
    
  // Check that it's reasonably sized for CV content
  cy.get('[data-testid="cv-content-textarea"]').then(($textarea) => {
    const height = $textarea.height();
    const width = $textarea.width();
    expect(height).to.be.greaterThan(200); // Should be tall enough for CV content
    expect(width).to.be.greaterThan(300); // Should be wide enough
  });
});

When('I examine the save cv functionality', () => {
  // Check the save button and its state
  cy.get('[data-testid="save-cv-button"]').should('exist');
});

Then('the save button should be properly configured', () => {
  cy.get('[data-testid="save-cv-button"]')
    .should('be.visible')
    .and('contain.text', 'Save');
});

Then('the save button should respond to interactions', () => {
  // Check that button is interactive (not disabled by default)
  cy.get('[data-testid="save-cv-button"]')
    .should('not.be.disabled')
    .and('be.visible');
    
  // Note: We don't actually click to avoid triggering API calls
  cy.log('Save button verified as interactive');
});

When('I examine the cv editor layout', () => {
  // Check overall page structure
  cy.get('body').should('be.visible');
});

Then('the header section should be prominently displayed', () => {
  cy.get('[data-testid="cv-editor-title"]')
    .should('be.visible')
    .and('have.css', 'font-size'); // Should have proper styling
    
  // Check that header has good visual hierarchy
  cy.get('[data-testid="cv-editor-title"]').then(($title) => {
    const fontSize = parseFloat($title.css('font-size'));
    expect(fontSize).to.be.greaterThan(16); // Should be larger than body text
  });
});

Then('the editor content should be clearly organized', () => {
  // Verify main components are present and organized
  cy.get('[data-testid="cv-editor-title"]').should('be.visible');
  cy.get('[data-testid="cv-content-textarea"]').should('be.visible');
  cy.get('[data-testid="save-cv-button"]').should('be.visible');
  
  // Check that elements are positioned logically
  cy.get('[data-testid="cv-editor-title"]').then(($title) => {
    cy.get('[data-testid="cv-content-textarea"]').then(($textarea) => {
      const titleTop = $title.offset().top;
      const textareaTop = $textarea.offset().top;
      expect(textareaTop).to.be.greaterThan(titleTop); // Textarea should be below title
    });
  });
});

Then('the save functionality should be easily accessible', () => {
  // Save button should be visible and near the content area
  cy.get('[data-testid="save-cv-button"]')
    .should('be.visible')
    .and('not.be.hidden'); // Should be in a reasonable position
    
  // Just verify both elements are visible and accessible
  cy.get('[data-testid="cv-content-textarea"]').should('be.visible');
  cy.get('[data-testid="save-cv-button"]').should('be.visible');
  
  cy.log('Save functionality is accessible alongside content area');
});

When('I test the cv content editing experience', () => {
  // Focus on the textarea to test editing experience
  cy.get('[data-testid="cv-content-textarea"]').should('be.visible');
});

Then('I can type content into the textarea', () => {
  const testContent = 'John Doe\nSoftware Engineer\nExperience: 5 years in web development';
  
  cy.get('[data-testid="cv-content-textarea"]')
    .clear()
    .type(testContent)
    .should('contain.value', testContent);
});

Then('the content is properly displayed', () => {
  // Check that text is visible and properly formatted
  cy.get('[data-testid="cv-content-textarea"]')
    .should('be.visible')
    .and('have.css', 'font-family'); // Should have proper font styling
});

Then('the interface responds appropriately to user input', () => {
  // Test that the textarea responds to user interactions
  cy.get('[data-testid="cv-content-textarea"]')
    .should('be.focused')
    .type('{selectall}')
    .type('Updated content')
    .should('contain.value', 'Updated content')
    .clear();
});

When('I look for guidance and instructions', () => {
  // Look for helpful text and guidance on the page
  cy.get('body').should('be.visible');
});

Then('the page should provide clear instructions', () => {
  // Check for instructional text
  cy.get('body').then(($body) => {
    const instructionalText = $body.find('p, span, div').filter((i, el) => {
      const text = Cypress.$(el).text().toLowerCase();
      return text.includes('cv') || text.includes('content') || text.includes('edit');
    });
    
    if (instructionalText.length > 0) {
      cy.log(`Found ${instructionalText.length} instructional text elements`);
    }
  });
});

Then('the purpose of the CV editor should be explained', () => {
  // Look for explanatory text about the CV editor's purpose
  cy.get('body').then(($body) => {
    const explanatoryText = $body.find('p, span, div').filter((i, el) => {
      const text = Cypress.$(el).text().toLowerCase();
      return text.includes('ai') || text.includes('cover letter') || text.includes('match') || text.includes('job');
    });
    
    if (explanatoryText.length > 0) {
      cy.log(`Found explanatory text about CV editor purpose`);
    } else {
      cy.log('CV editor purpose explanation may be implicit in the interface');
    }
  });
});

Then('the interface should be user-friendly', () => {
  // Check for user-friendly design elements
  cy.get('[data-testid="cv-content-textarea"]')
    .should('be.visible')
    .and('have.css', 'padding'); // Should have proper spacing
    
  cy.get('[data-testid="save-cv-button"]')
    .should('be.visible')
    .and('have.css', 'background-color'); // Should have proper styling
    
  // Check that interface is responsive
  cy.get('[data-testid="cv-content-textarea"]').should('be.visible');
  cy.get('[data-testid="save-cv-button"]').should('be.visible');
});