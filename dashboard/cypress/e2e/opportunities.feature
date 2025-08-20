Feature: Opportunities Page Navigation and Data Integrity
  As a job seeker
  I want the opportunities menu badge to accurately reflect the number of opportunities
  So that I can trust the navigation indicators and quickly see how many opportunities I have

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: Opportunities badge count matches table results
    Given I am on the "opportunities" page
    When I check the opportunities menu badge count
    Then the number of opportunities in the table should match the badge count
    And the opportunities table should display correctly

  Scenario: Opportunities page displays job data correctly
    Given I am on the "opportunities" page
    When the page loads completely
    Then I should see the opportunities header
    And the opportunities table should be visible
    And job data should be properly formatted if present
    And search functionality should be available

  Scenario: Opportunities statistics match displayed data
    Given I am on the "opportunities" page
    When I examine the statistics section
    Then the total jobs count should match the table rows
    And statistics should be accurate and readable

  Scenario: Opportunities table functionality works
    Given I am on the "opportunities" page
    When there are opportunities in the table
    Then each opportunity should display required information
    And action buttons should be available for each opportunity
    And table columns should be properly aligned

  Scenario: Empty opportunities state is handled properly
    Given I am on the "opportunities" page
    When there are no opportunities available
    Then an appropriate empty state should be displayed
    And the user should understand there are no current opportunities