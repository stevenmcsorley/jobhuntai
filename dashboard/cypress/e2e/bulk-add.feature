Feature: Bulk Add Jobs Functionality
  As a recruiter or job seeker
  I want to import multiple job listings at once using JSON
  So that I can efficiently add many jobs without manual entry

  Background:
    Given I visit the application
    And I am on the "bulk-add" page
    And I wait for the page to load

  Scenario: Bulk add page displays correctly
    Then I should see "Bulk Add Jobs"
    And I should see the JSON input textarea
    And I should see the "Import Jobs" button
    And the format guide should be visible
    And required field indicators should be shown

  Scenario: Valid JSON import succeeds
    When I enter valid JSON job data
    And I click the import jobs button
    Then I should see a bulk import success message
    And the input field should be cleared
    And the jobs should be imported into the system

  Scenario: Invalid JSON format is rejected
    When I enter invalid JSON data
    And I click the import jobs button
    Then I should see an error message about invalid JSON format
    And the input field should retain the invalid data
    And no jobs should be imported

  Scenario: Non-array JSON is rejected
    When I enter JSON that is not an array
    And I click the import jobs button
    Then I should see an error message about requiring an array
    And the input field should retain the data
    And no jobs should be imported

  Scenario: Missing required fields are handled
    When I enter JSON with missing required fields
    And I click the import jobs button
    Then I should see warning messages for failed imports
    And valid jobs should still be imported
    And invalid jobs should be skipped

  Scenario: Empty input validation
    When I leave the JSON input empty
    And I click the import jobs button
    Then the form should not submit due to required field
    And I should see form validation

  Scenario: Loading state is shown during import
    When I enter valid JSON job data
    And I click the import jobs button
    Then I should see the loading state with spinner
    And the button should be disabled during import
    And the button text should change to "Importing..."

  Scenario: Format guide provides helpful information
    Then the format guide should show required fields
    And the format guide should show optional fields
    And the format guide should provide a valid JSON example
    And field types should be clearly indicated

  Scenario: Large JSON import works
    When I enter a large valid JSON array with multiple jobs
    And I click the import jobs button
    Then all valid jobs should be imported successfully
    And I should see the total count in success message