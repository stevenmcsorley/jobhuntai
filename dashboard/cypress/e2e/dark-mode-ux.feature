Feature: Dark Mode UX Testing
  As a user who prefers dark mode
  I want all text and UI elements to be clearly visible in dark mode
  So that I can use the application comfortably

  Background:
    Given I visit the application
    And the application is in "dark" mode

  Scenario: Dashboard has proper dark mode contrast
    Given I am on the "dashboard" page
    Then the page title should be visible and readable
    And job statistics should have good contrast
    And table headers should be readable in dark mode
    And action buttons should be clearly visible

  Scenario: Opportunities page is usable in dark mode
    Given I am on the "opportunities" page
    Then the page should load successfully
    And any job cards should be readable if present
    And navigation elements should be visible

  Scenario: Test Hub forms are accessible in dark mode
    Given I am on the "test-hub" page
    Then form elements should be clearly visible
    And any dropdown menus should be readable
    And submit buttons should be accessible

  Scenario: Market Fit page displays correctly in dark mode
    Given I am on the "market-fit" page
    Then the page content should be visible
    And any charts should be properly themed for dark mode
    And analysis text should be readable

  Scenario: CV Editor is functional in dark mode
    Given I am on the "cv-editor" page
    Then text editing areas should have proper contrast
    And form controls should be clearly visible
    And save/edit buttons should be accessible

  Scenario: Bulk Add page forms work in dark mode
    Given I am on the "bulk-add" page
    Then input fields should have good contrast
    And form instructions should be readable
    And any code examples should be visible

  Scenario: Theme toggle functionality works correctly
    Given I am on the "dashboard" page
    When I toggle the theme from dark to light
    Then the page should switch to light mode
    When I toggle the theme from light to dark
    Then the page should switch to dark mode