Feature: Job Details page basic functionality

  Background:
    Given I visit the job details page

  Scenario: Job details page loads correctly
    Then I should see the job details header
    And I should see the job title
    And I should see the job tabs
    And I should see the job content area

  Scenario: Tab navigation works correctly
    When I click on the "company-info" tab
    Then the company info tab should be active
    When I click on the "cv-match" tab
    Then the cv match tab should be active
    When I click on the "interview-prep" tab
    Then the interview prep tab should be active

  Scenario: Description tab functionality
    When I am on the "description" tab
    Then I should see the job description textarea
    And I should see the save description button
    And I should see the extract skills button

  Scenario: Company info tab functionality
    When I click on the "company-info" tab
    Then I should see the generate company info button
    And I should see the company info content area

  Scenario: CV Match tab functionality
    When I click on the "cv-match" tab
    Then I should see the run cv match button
    And the cv match interface should be functional

  Scenario: Interview prep tab functionality
    When I click on the "interview-prep" tab
    Then I should see the generate interview prep button
    And interview prep sections should be properly structured

  Scenario: Cover letter tab functionality
    When I click on the "cover-letter" tab
    Then I should see the generate cover letter button
    And I should see the cover letter textarea

  Scenario: Navigation and controls work
    Then the back button should be functional
    And the status updater should be visible
    And the page should be responsive