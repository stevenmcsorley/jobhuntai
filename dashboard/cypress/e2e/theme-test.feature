Feature: Theme Toggle Test
  As a user
  I want to test theme switching
  So that I can verify dark mode works

  Scenario: Quick theme toggle test
    Given I visit the application
    When I wait for the page to load
    Then I should see the theme toggle
    When I click on the theme toggle
    Then I capture a screenshot for analysis
    And the theme should switch