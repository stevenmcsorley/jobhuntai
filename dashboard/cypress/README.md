# Cypress BDD Testing for JobHunt AI

This directory contains end-to-end tests using Cypress with Behavior Driven Development (BDD) approach for the JobHunt AI application.

## Overview

The test suite focuses on:
- **UX Testing**: Validating user experience across different themes and viewports
- **Dark Mode Testing**: Ensuring text visibility and proper contrast in dark theme
- **Screenshot Capture**: Automated screenshots for Claude Code analysis
- **User Flows**: Testing critical user journeys through BDD scenarios

## Test Structure

```
cypress/
├── e2e/                          # BDD feature files
│   ├── dashboard.feature         # Dashboard functionality
│   ├── test-hub.feature         # Test Hub functionality
│   ├── job-management.feature   # Job CRUD operations
│   └── dark-mode-ux.feature     # Dark mode UX testing
├── support/
│   ├── step_definitions/        # Cucumber step definitions
│   ├── commands.js              # Custom Cypress commands
│   ├── screenshot-helper.js     # Screenshot utilities
│   └── e2e.js                   # Global test setup
├── fixtures/                    # Test data
├── screenshots/                 # Auto-captured screenshots
└── reports/                     # Test reports
```

## Available Commands

### Basic Commands
```bash
# Open Cypress GUI
npm run cy:open

# Run all tests headlessly
npm run cy:run

# Run tests with browser visible
npm run cy:run:headed
```

### Test Categories
```bash
# Test dashboard functionality
npm run test:dashboard

# Test dark mode UX
npm run test:dark-mode

# Test Test Hub features
npm run test:test-hub

# Run with server startup
npm run test:e2e
npm run test:e2e:open
```

### Screenshot Capture
```bash
# Capture screenshots for UX analysis
npm run capture:screenshots

# Run UX analysis tests with screenshots
npm run analyze:ux
```

## Features Tested

### 1. Dashboard Navigation (`dashboard.feature`)
- Dashboard overview display
- Navigation between sections
- Dark mode functionality
- Statistics visibility
- Job table interactions

### 2. Test Hub (`test-hub.feature`)
- Test configuration
- Different test types (short answer, multiple choice, code challenge, behavioral)
- Test execution flow
- History viewing
- Dark mode compatibility

### 3. Job Management (`job-management.feature`)
- Manual job addition
- Bulk job import
- Job opportunities viewing
- Filtering and search
- Job details viewing
- Job deletion

### 4. Dark Mode UX (`dark-mode-ux.feature`)
- Text visibility across all pages
- Form element contrast
- Modal dialogs in dark mode
- Chart and visualization theming
- Interactive element visibility

## Screenshot Analysis for Claude Code

The test suite automatically captures screenshots for Claude Code analysis:

### Screenshot Types
1. **Full Page Captures**: Complete page screenshots in different states
2. **Before/After Comparisons**: UI changes after user actions  
3. **Dark/Light Mode Comparisons**: Theme comparison screenshots
4. **Responsive Views**: Different viewport screenshots
5. **Error States**: Screenshots when tests fail for debugging

### Screenshot Naming Convention
Screenshots are named with the pattern:
```
{test-name}-{analysis-type}-{timestamp}
```

Examples:
- `dashboard-dark-mode-visibility-2024-01-20T10-30-00`
- `test-hub-form-interaction-2024-01-20T10-31-15`

### Analyzing Screenshots with Claude Code
1. Run the UX analysis tests: `npm run analyze:ux`
2. Screenshots are saved to `cypress/screenshots/`
3. Upload screenshots to Claude Code for UX analysis
4. Use the captured metadata for context

## Custom Commands

### Navigation
- `cy.navigateToPage(pageName)` - Navigate to specific pages
- `cy.waitForApp()` - Wait for application to load

### Theme Testing
- `cy.switchTheme(theme)` - Switch between light/dark themes
- `cy.testDarkModeVisibility()` - Test text visibility in dark mode

### Screenshot Capture
- `cy.captureForClaudeAnalysis(name, options)` - Capture for analysis
- `cy.captureUXFlow(flowName, stepName)` - Capture user flow steps
- `cy.captureDarkModeComparison(pageName)` - Compare themes
- `cy.captureResponsiveViews(pageName)` - Multi-viewport capture

### Job Management
- `cy.addJob(jobData)` - Add a new job
- `cy.startTest(testConfig)` - Start a skills test

## BDD Step Definitions

### Common Steps
- `Given I am on the "page" page`
- `When I click on "element"`
- `Then I should see "text"`
- `And I capture a screenshot for analysis`

### Dark Mode Steps
- `Given the application is in "dark" mode`
- `Then all text should be visible in dark mode`
- `And dropdown text should be visible`

### Test Hub Steps
- `When I select "option" from "dropdown"`
- `Then I should see a test question`
- `And I should see multiple choice options`

## Configuration

Key configuration in `cypress.config.js`:
- Base URL: `http://localhost:3000`
- Viewport: 1280x720 (default)
- Screenshots: Full page capture enabled
- Videos: Enabled for debugging
- Timeouts: 10 seconds for commands

## CI/CD Integration

For continuous integration:
```bash
# Run tests in CI mode
npm run test:e2e

# Generate reports
npm run cy:run -- --reporter mochawesome
```

## Troubleshooting

### Common Issues
1. **Server not running**: Ensure the React dev server is running on port 3000
2. **Element not found**: Check if data-cy attributes are added to components
3. **Screenshots not capturing**: Verify screenshot folder permissions
4. **Dark mode not switching**: Check theme toggle implementation

### Debugging
- Use `cy:run:headed` to see tests run in browser
- Check `cypress/screenshots/` for failure screenshots
- Review `cypress/videos/` for test execution videos
- Use `cy.debug()` in step definitions for breakpoints

## Adding New Tests

1. Create a new `.feature` file in `cypress/e2e/`
2. Write scenarios in Gherkin syntax
3. Add corresponding step definitions in `cypress/support/step_definitions/`
4. Add data-cy attributes to components being tested
5. Include screenshot captures for UX analysis

Example feature:
```gherkin
Feature: New Feature
  As a user
  I want to perform an action
  So that I can achieve a goal

  Scenario: Test scenario
    Given I am on the "page" page
    When I click on "button"
    Then I should see "result"
    And I capture a screenshot for analysis
```