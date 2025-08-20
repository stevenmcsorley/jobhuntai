Feature: Market-Fit page basic functionality

  Background:
    Given I visit the market-fit page

  Scenario: Market-Fit page loads correctly
    Then I should see the market fit page title
    And the page should be properly structured

  Scenario: Empty state displays correctly
    Then I should see the empty state when no data is available
    And I should see the empty state icon
    And I should see helpful guidance message

  Scenario: Loaded state displays market analysis
    Given market data is available
    Then I should see the loaded market fit title
    And I should see the analysis subtitle
    And I should see the analysis card

  Scenario: Skills analysis section is functional
    Given market data is available
    Then I should see the skills analysis title
    And I should see the skills chart container
    And chart should display skill data

  Scenario: Page layout adapts to different data states
    Then the page should handle loading states gracefully
    And content should be properly organized
    And responsive design should work correctly

  Scenario: Market analysis provides meaningful insights
    Given market data is available
    Then skills data should be clearly presented
    And percentage information should be visible
    And analysis should be informative