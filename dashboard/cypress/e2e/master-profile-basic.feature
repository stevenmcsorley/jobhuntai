Feature: Master Profile Basic Functionality
  As a job seeker
  I want to manage my master profile information
  So that I can maintain accurate professional data for AI analysis

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: Master Profile page loads and displays correctly
    Given I am on the "master-profile" page
    When the page loads completely
    Then I should see the master profile title
    And I should see the profile management interface
    And I should see the download profile button

  Scenario: Profile sections are present and accessible
    Given I am on the "master-profile" page
    When I examine the profile sections
    Then I should see the personal profile section
    And I should see the skills section
    And I should see the work experience section
    And I should see the projects section
    And I should see the education section

  Scenario: Profile action buttons work appropriately
    Given I am on the "master-profile" page
    When I check the profile action buttons
    Then I should see the download profile button
    And the download button should be properly configured
    And the buttons should respond to interactions

  Scenario: Profile page layout is well-organized
    Given I am on the "master-profile" page
    When I examine the profile page layout
    Then the header section should be clearly visible
    And the profile content should be organized in logical sections
    And the page should be responsive and accessible

  Scenario: Profile data loading states are handled
    Given I am on the "master-profile" page
    When the profile data loads
    Then the loading state should be handled gracefully
    And the content should display properly once loaded

  Scenario: Profile sections support data management
    Given I am on the "master-profile" page
    When I examine individual profile sections
    Then each section should be clearly labeled
    And each section should support data entry or display
    And the sections should be visually organized