Feature: Dark Mode UX Testing
  As a user who prefers dark mode
  I want all text and UI elements to be clearly visible in dark mode
  So that I can use the application comfortably

  Background:
    Given I visit the application
    And the application is in "dark" mode

  Scenario: Dashboard dark mode visibility
    Given I am on the "dashboard" page
    Then all text should be visible in dark mode
    And I should see readable job statistics
    And I should see readable table headers
    And I capture a screenshot for analysis

  Scenario: Opportunities page dark mode visibility
    Given I am on the "opportunities" page
    Then all text should be visible in dark mode
    And job cards should be readable
    And filter options should be visible
    And I capture a screenshot for analysis

  Scenario: Test Hub dark mode visibility
    Given I am on the "test-hub" page
    Then all text should be visible in dark mode
    And form labels should be readable
    And dropdown options should be visible
    And I capture a screenshot for analysis

  Scenario: Market Fit page dark mode visibility
    Given I am on the "market-fit" page
    Then all text should be visible in dark mode
    And skill analysis should be readable
    And charts should be properly themed
    And I capture a screenshot for analysis

  Scenario: CV Editor dark mode visibility
    Given I am on the "cv-editor" page
    Then all text should be visible in dark mode
    And text areas should have proper contrast
    And form controls should be visible
    And I capture a screenshot for analysis

  Scenario: Forms and inputs in dark mode
    Given I am on the "bulk-add" page
    Then all text should be visible in dark mode
    And form instructions should be readable
    And code examples should be visible
    And input fields should have proper contrast
    And I capture a screenshot for analysis

  Scenario: Modal dialogs in dark mode
    Given I am on the "dashboard" page
    When I click the "Add Job" button
    Then the modal should be visible in dark mode
    And modal text should be readable
    And form fields in modal should have proper contrast
    And I capture a screenshot for analysis