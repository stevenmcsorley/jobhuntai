Feature: Stats Page Basic Functionality
  As a job seeker
  I want to view my application statistics and charts
  So that I can track my job search progress and performance

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: Stats page loads and displays correctly
    Given I am on the "stats" page
    When the page loads completely
    Then I should see the stats page title
    And I should see the statistics overview interface

  Scenario: Statistics cards display properly
    Given I am on the "stats" page
    When I examine the statistics cards
    Then I should see the stats cards grid
    And the stat cards should display application metrics
    And the stat cards should have proper labels and values
    And the stat cards should be visually organized

  Scenario: Charts section displays data visualization
    Given I am on the "stats" page
    When I examine the charts section
    Then I should see the stats charts grid
    And the charts should be properly rendered
    And the charts should have appropriate titles

  Scenario: Stats page layout is well-structured
    Given I am on the "stats" page
    When I examine the stats page layout
    Then the header section should be clearly displayed
    And the statistics content should be logically organized
    And the page should have good visual hierarchy

  Scenario: Statistics provide meaningful insights
    Given I am on the "stats" page
    When I analyze the statistics content
    Then the stats should show application tracking data
    And the metrics should be clearly presented
    And the data should be easy to understand

  Scenario: Stats page handles different data states
    Given I am on the "stats" page
    When I check for data availability
    Then the page should handle data loading appropriately
    And the statistics should be displayed when available
    And the interface should be responsive to data states