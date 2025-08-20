Feature: Preferences page basic functionality

  Background:
    Given I visit the preferences page

  Scenario: Preferences page loads correctly
    Then I should see the preferences page title
    And I should see the save preferences button
    And I should see the preferences form

  Scenario: Form fields are functional
    Then I should see the keywords input field
    And I should see the stack keywords textarea
    And I should see the market fit skills textarea
    And I should see the town input field
    And I should see the radius select dropdown
    And I should see the location input field
    And I should see the salary input field

  Scenario: Form inputs accept user input
    When I type "React Developer" in the keywords input
    And I type "react,javascript,typescript" in the stack keywords textarea
    And I type "React,JavaScript,TypeScript" in the market fit skills textarea
    Then the form fields should contain the entered values

  Scenario: Save button is interactive
    When I click the save preferences button
    Then the button should show saving state

  Scenario: Preferences form layout is well-structured
    Then the preferences form should be properly laid out
    And form fields should be appropriately sized
    And labels should be clearly visible

  Scenario: Form handles different input types correctly
    When I select "20" from the radius dropdown
    And I enter "Manchester" in the town field
    And I enter "£70,000" in the salary field
    Then the form should accept various input formats