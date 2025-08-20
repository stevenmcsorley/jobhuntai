Feature: CV Editor Basic Functionality
  As a job seeker
  I want to edit and manage my CV content
  So that I can keep my resume up to date for AI analysis

  Background:
    Given I visit the application
    And I wait for the page to load

  Scenario: CV Editor page loads and displays correctly
    Given I am on the "cv-editor" page
    When the page loads completely
    Then I should see the cv editor title
    And I should see the cv content editor interface
    And I should see the save cv button

  Scenario: CV content textarea is functional
    Given I am on the "cv-editor" page
    When I interact with the cv content area
    Then I should see the cv content textarea
    And the textarea should accept text input
    And the textarea should have appropriate placeholder text
    And the textarea should be properly sized and styled

  Scenario: Save CV functionality works
    Given I am on the "cv-editor" page
    When I examine the save cv functionality
    Then I should see the save cv button
    And the save button should be properly configured
    And the save button should respond to interactions

  Scenario: CV Editor layout is well-organized
    Given I am on the "cv-editor" page
    When I examine the cv editor layout
    Then the header section should be prominently displayed
    And the editor content should be clearly organized
    And the save functionality should be easily accessible

  Scenario: CV content editing experience is smooth
    Given I am on the "cv-editor" page
    When I test the cv content editing experience
    Then I can type content into the textarea
    And the content is properly displayed
    And the interface responds appropriately to user input

  Scenario: CV Editor provides helpful guidance
    Given I am on the "cv-editor" page
    When I look for guidance and instructions
    Then the page should provide clear instructions
    And the purpose of the CV editor should be explained
    And the interface should be user-friendly