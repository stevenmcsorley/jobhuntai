Feature: User Authentication
  As a user
  I want to be able to register and login
  So that I can access the JobHunt AI application

  Background:
    Given I visit the application

  Scenario: User registration with valid data
    Given I am on the login page
    When I click on "Create Account" toggle
    And I fill in the registration form with valid data
    And I submit the registration form
    Then I should be successfully registered and logged in
    And I should see the dashboard

  Scenario: User registration with invalid data
    Given I am on the login page
    When I click on "Create Account" toggle
    And I fill in the registration form with invalid data
    And I submit the registration form
    Then I should see registration error messages

  Scenario: User login with valid credentials
    Given I am on the login page
    And a test user exists
    When I fill in the login form with valid credentials
    And I submit the login form
    Then I should be successfully logged in
    And I should see the dashboard

  Scenario: User login with invalid credentials
    Given I am on the login page
    When I fill in the login form with invalid credentials
    And I submit the login form
    Then I should see login error messages

  Scenario: Demo account login
    Given I am on the login page
    When I fill in the login form with demo account credentials
    And I submit the login form
    Then I should be successfully logged in
    And I should see the dashboard with existing data

  Scenario: User logout
    Given I am logged in to the application
    When I click the logout button in the sidebar
    Then I should be logged out
    And I should see the login page

  Scenario: Protected routes redirect to login
    Given I am not logged in
    When I try to access a protected route directly
    Then I should be redirected to the login page

  Scenario: Token persistence across browser refresh
    Given I am logged in to the application
    When I refresh the page
    Then I should remain logged in
    And I should see the dashboard