Feature: Test Hub - Skills Testing and Practice
  As a job seeker
  I want to practice technical skills through the Test Hub
  So that I can improve my interview performance

  Background:
    Given I visit the application
    And I am on the "test-hub" page
    And I wait for the page to load

  Scenario: Access Test Hub
    Then I should see "Test Hub"
    And I should see "New Test"
    And I should see "History"
    And I capture a screenshot for analysis

  Scenario: Start a short answer test
    Given I am on the "test-hub" page
    When I click the "New Test" button
    And I select "short_answer" from "Test Type"
    And I select "React" from "Topic"
    And I select "Mid-Level" from "Difficulty"
    And I click the "Start Test" button
    Then I should see a test question
    And I capture a screenshot for analysis

  Scenario: Start a multiple choice test
    Given I am on the "test-hub" page
    When I select "multiple_choice" from "Test Type"
    And I select "JavaScript" from "Topic"
    And I select "Junior" from "Difficulty"
    And I click the "Start Test" button
    Then I should see multiple choice options
    And I capture a screenshot for analysis

  Scenario: Start a code challenge test
    Given I am on the "test-hub" page
    When I select "code_challenge" from "Test Type"
    And I select "Python" from "Topic"
    And I select "Senior" from "Difficulty"
    And I click the "Start Test" button
    Then I should see a code editor
    And I should see language selection
    And I capture a screenshot for analysis

  Scenario: Start a behavioral test with STAR framework
    Given I am on the "test-hub" page
    When I select "behavioral_star" from "Test Type"
    And I click the "Start Test" button
    Then I should see information about STAR method
    And I should see a behavioral question
    And I capture a screenshot for analysis

  Scenario: View test history
    Given I am on the "test-hub" page
    When I click the "History" button
    Then I should see test history table
    And I should see past test results
    And I capture a screenshot for analysis

  Scenario: Test Hub in dark mode
    Given I am on the "test-hub" page
    And the application is in "dark" mode
    Then all text should be visible in dark mode
    And dropdown text should be visible
    And I capture a screenshot for analysis