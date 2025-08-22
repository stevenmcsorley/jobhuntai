import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

// Background - use existing step from common.js

// Given steps
Given("I am on the login page", () => {
  cy.url().should('include', '/');
  cy.contains('JobHunt AI').should('be.visible');
  cy.contains('Sign in to your account').should('be.visible');
});

Given("a test user exists", () => {
  // Create a test user via API if it doesn't exist
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: {
      email: 'cypress-test@example.com',
      password: 'testpass123',
      name: 'Cypress Test User'
    },
    failOnStatusCode: false
  });
});

Given("I am logged in to the application", () => {
  // Login via API and set token
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email: 'jobhunter@localhost',
      password: 'password123'
    }
  }).then((response) => {
    const { token, user } = response.body;
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('user', JSON.stringify(user));
    cy.visit('/');
    cy.contains('Dashboard').should('be.visible');
  });
});

Given("I am not logged in", () => {
  cy.clearLocalStorage();
  cy.visit('/');
});

// When steps
When("I click on {string} toggle", (buttonText) => {
  if (buttonText === "Create Account") {
    cy.contains("Don't have an account? Sign up").click();
  } else if (buttonText === "Sign In") {
    cy.contains('Already have an account? Sign in').click();
  }
});

When("I fill in the registration form with valid data", () => {
  const timestamp = Date.now();
  cy.get('input[name="name"]').type('Cypress Test User');
  cy.get('input[name="email"]').type(`cypress-${timestamp}@example.com`);
  cy.get('input[name="password"]').type('testpass123');
  cy.get('input[name="confirmPassword"]').type('testpass123');
});

When("I fill in the registration form with invalid data", () => {
  cy.get('input[name="name"]').type('Test User');
  cy.get('input[name="email"]').type('invalid-email');
  cy.get('input[name="password"]').type('123'); // Too short
  cy.get('input[name="confirmPassword"]').type('different'); // Don't match
});

When("I submit the registration form", () => {
  cy.get('button[type="submit"]').click();
});

When("I fill in the login form with valid credentials", () => {
  cy.get('input[name="email"]').type('cypress-test@example.com');
  cy.get('input[name="password"]').type('testpass123');
});

When("I fill in the login form with invalid credentials", () => {
  cy.get('input[name="email"]').type('nonexistent@example.com');
  cy.get('input[name="password"]').type('wrongpassword');
});

When("I fill in the login form with demo account credentials", () => {
  cy.get('input[name="email"]').type('jobhunter@localhost');
  cy.get('input[name="password"]').type('password123');
});

When("I submit the login form", () => {
  cy.get('button[type="submit"]').click();
});

When("I click the logout button in the sidebar", () => {
  cy.get('button[title="Logout"]').click();
});

When("I try to access a protected route directly", () => {
  cy.visit('/dashboard');
});

When("I refresh the page", () => {
  cy.reload();
});

// Then steps
Then("I should be successfully registered and logged in", () => {
  cy.contains('Welcome,').should('be.visible');
  cy.url().should('not.include', '/login');
});

Then("I should see registration error messages", () => {
  // Check for various error messages
  cy.get('body').should('contain.text', 'error').or('contain.text', 'Password');
});

Then("I should be successfully logged in", () => {
  cy.contains('Welcome back,').should('be.visible');
  cy.url().should('not.include', '/login');
});

Then("I should see login error messages", () => {
  cy.contains('Invalid email or password').should('be.visible');
});

Then("I should see the dashboard", () => {
  cy.contains('Dashboard').should('be.visible');
  cy.contains('Follow-up').should('be.visible');
});

Then("I should see the dashboard with existing data", () => {
  cy.contains('Dashboard').should('be.visible');
  cy.contains('Follow-up').should('be.visible');
  // Should see some existing applications/jobs
  cy.get('.surface-card').should('have.length.greaterThan', 2);
});

Then("I should be logged out", () => {
  cy.contains('Sign in to your account').should('be.visible');
  cy.contains('JobHunt AI').should('be.visible');
});

Then("I should see the login page", () => {
  cy.contains('Sign in to your account').should('be.visible');
  cy.contains('JobHunt AI').should('be.visible');
  cy.get('input[name="email"]').should('be.visible');
});

Then("I should be redirected to the login page", () => {
  cy.url().should('include', '/');
  cy.contains('Sign in to your account').should('be.visible');
});

Then("I should remain logged in", () => {
  cy.contains('Dashboard').should('be.visible');
  cy.url().should('not.include', '/login');
});