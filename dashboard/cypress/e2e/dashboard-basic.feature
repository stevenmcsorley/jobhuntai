Feature: Dashboard Basic Functionality
  As a job seeker
  I want to use the dashboard to view my job search overview
  So that I can track my progress and take actions

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: Dashboard page loads and displays key elements
    Given I am on the "dashboard" page
    When the page loads completely
    Then I should see the dashboard title
    And I should see the dashboard statistics section
    And I should see the main action buttons
    And I should see the search functionality

  Scenario: Dashboard statistics display correctly
    Given I am on the "dashboard" page
    When I examine the dashboard statistics section
    Then I should see stat cards for job metrics
    And the stat cards should display numerical values
    And the stat cards should be properly labeled

  Scenario: Main action buttons are functional
    Given I am on the "dashboard" page
    When I check the main action buttons
    Then I should see the dashboard "Add Job" button
    And I should see the dashboard "Find New Jobs" button
    And the buttons should be clickable and responsive

  Scenario: Search functionality works
    Given I am on the "dashboard" page
    When I interact with the search input
    Then I should be able to type in the search field
    And the search input should accept text input
    And the search input should have appropriate placeholder text

  Scenario: Dashboard layout is responsive and well-structured
    Given I am on the "dashboard" page
    When I examine the page layout
    Then the header section should be properly positioned
    And the statistics section should be laid out in a grid
    And the content should be organized in logical sections

  Scenario: Dashboard shows application trends chart
    Given I am on the "dashboard" page
    When I look for the trends section
    Then I should see a section for application trends
    And the trends section should be properly labeled

  Scenario: Jobs tables are present and functional
    Given I am on the "dashboard" page
    When I examine the jobs tables
    Then I should see the Follow-up jobs table
    And I should see the Applied jobs table
    And the tables should have proper headers and structure