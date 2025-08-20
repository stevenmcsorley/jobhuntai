Feature: Screenshot Capture for UX Analysis
  As a developer
  I want to capture screenshots of different pages in both light and dark modes
  So that I can analyze the UX with Claude Code

  Scenario: Capture dashboard screenshots
    Given I visit the application
    When I wait for the page to load
    Then I capture a screenshot for analysis
    When the application is in "dark" mode
    Then I capture a screenshot for analysis

  Scenario: Capture opportunities page screenshots
    Given I am on the "opportunities" page
    When I wait for the page to load
    Then I capture a screenshot for analysis
    When the application is in "dark" mode
    Then I capture a screenshot for analysis

  Scenario: Capture test hub screenshots
    Given I am on the "test-hub" page
    When I wait for the page to load
    Then I capture a screenshot for analysis
    When the application is in "dark" mode
    Then I capture a screenshot for analysis

  Scenario: Capture market fit screenshots
    Given I am on the "market-fit" page
    When I wait for the page to load
    Then I capture a screenshot for analysis
    When the application is in "dark" mode
    Then I capture a screenshot for analysis

  Scenario: Capture CV editor screenshots
    Given I am on the "cv-editor" page
    When I wait for the page to load
    Then I capture a screenshot for analysis
    When the application is in "dark" mode
    Then I capture a screenshot for analysis

  Scenario: Capture bulk add screenshots
    Given I am on the "bulk-add" page
    When I wait for the page to load
    Then I capture a screenshot for analysis
    When the application is in "dark" mode
    Then I capture a screenshot for analysis