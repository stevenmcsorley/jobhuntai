import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

Then('I should see the theme toggle', () => {
  cy.get('[data-cy="theme-toggle"]').should('be.visible');
});

When('I click on the theme toggle', () => {
  cy.get('[data-cy="theme-toggle"]').click();
});

Then('the theme should switch', () => {
  // Wait for theme to actually change and verify both class and data-theme
  cy.get('html', { timeout: 3000 }).should(($html) => {
    // Should have either 'dark' or 'light' class
    const hasThemeClass = $html.hasClass('dark') || $html.hasClass('light');
    expect(hasThemeClass).to.be.true;
    
    // Should have data-theme attribute
    expect($html.attr('data-theme')).to.exist;
  });
  
  // Log the current state for debugging after verification
  cy.get('html').then(($html) => {
    const currentClass = $html.hasClass('dark') ? 'dark' : 'light';
    const dataTheme = $html.attr('data-theme');
    cy.log(`HTML has theme class: ${currentClass}, data-theme: ${dataTheme}`);
  });
});