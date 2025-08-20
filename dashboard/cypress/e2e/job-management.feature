Feature: Job Management
  As a job seeker
  I want to manage my job applications
  So that I can track my progress and organize my job search

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: Add a new job manually
    Given I am on the "dashboard" page
    When I click the "Add Job" button
    And I fill in "Job Title" with "Software Engineer"
    And I fill in "Company" with "Tech Corp"
    And I fill in "URL" with "https://example.com/job/123"
    And I fill in "Location" with "San Francisco, CA"
    And I click the "Save Job" button
    Then I should see "Software Engineer" in the jobs table
    And I capture a screenshot for analysis

  Scenario: Bulk add jobs
    Given I am on the "bulk-add" page
    When I fill in the JSON input with valid job data
    And I click the "Import Jobs" button
    Then I should see a success message
    And the jobs should be imported
    And I capture a screenshot for analysis

  Scenario: View job opportunities
    Given I am on the "opportunities" page
    Then I should see available job opportunities
    And I should see job filtering options
    And each job card should show key information
    And I capture a screenshot for analysis

  Scenario: Filter job opportunities
    Given I am on the "opportunities" page
    When I apply skill filters
    And I apply location filters
    Then the job list should be filtered accordingly
    And I capture a screenshot for analysis

  Scenario: View job details
    Given I am on the "dashboard" page
    When I click on a job title
    Then I should see detailed job information
    And I should see job analysis if available
    And I capture a screenshot for analysis

  Scenario: Delete a job application
    Given I am on the "dashboard" page
    When I click the action menu for a job
    And I click "Delete"
    And I confirm the deletion
    Then the job should be removed from the list
    And I capture a screenshot for analysis