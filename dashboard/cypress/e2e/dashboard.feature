Feature: Dashboard Navigation and Overview
  As a job seeker
  I want to navigate the dashboard and see my job application overview
  So that I can manage my job search effectively

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: Dashboard displays correctly
    Given I am on the "dashboard" page
    Then I should see "Job Hunt Dashboard"
    And I should see "Applied Jobs"
    And I should see "Follow-up"

  Scenario: Navigation between sections works
    Given I am on the "dashboard" page
    When I click on "Opportunities"
    Then I should be on the "opportunities" page
    And the page should load without errors

  Scenario: Dashboard statistics are functional
    Given I am on the "dashboard" page
    Then job statistics should be displayed correctly
    And statistics should be readable and accessible

  Scenario: Job management table works
    Given I am on the "dashboard" page
    When the page loads completely
    Then the jobs table should be present if there are jobs
    And any action buttons should be functional

  Scenario: Dashboard works in both themes
    Given I am on the "dashboard" page
    When I toggle between light and dark themes
    Then the page should remain functional in both themes
    And all text should remain readable

  Scenario: Dashboard responsive design
    Given I am on the "dashboard" page
    Then the layout should be responsive
    And important elements should be accessible
    And navigation should work properly