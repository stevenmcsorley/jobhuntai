Feature: Dashboard Navigation and Overview
  As a job seeker
  I want to navigate the dashboard and see my job application overview
  So that I can manage my job search effectively

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: View dashboard overview
    Given I am on the "dashboard" page
    Then I should see "Job Hunt Dashboard"
    And I should see "Applied Jobs"
    And I should see "Follow-up"
    And I capture a screenshot for analysis

  Scenario: Navigate between different sections
    Given I am on the "dashboard" page
    When I click on "Opportunities"
    Then I should be on the "opportunities" page
    And I capture a screenshot for analysis

  Scenario: View dashboard in dark mode
    Given I am on the "dashboard" page
    And the application is in "dark" mode
    Then all text should be visible in dark mode
    And I capture a screenshot for analysis

  Scenario: Dashboard statistics are displayed
    Given I am on the "dashboard" page
    Then I should see applied jobs statistics
    And I should see follow-up jobs statistics
    And I capture a screenshot for analysis

  Scenario: Job table functionality
    Given I am on the "dashboard" page
    When I wait for the page to load
    Then I should see the jobs table
    And the jobs table should have action buttons
    And I capture a screenshot for analysis