// Screenshot helper for Claude Code analysis

/**
 * Captures screenshots with consistent naming and metadata for Claude Code analysis
 */
export class ScreenshotHelper {
  static captureForAnalysis(testName, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotName = `${testName}-analysis-${timestamp}`;
    
    // Default options for Claude Code analysis
    const defaultOptions = {
      capture: 'fullPage',
      overwrite: true,
      blackout: [
        '[data-cy="sensitive-info"]',
        '.api-key',
        '.token'
      ],
      ...options
    };
    
    cy.screenshot(screenshotName, defaultOptions);
    
    // Log metadata for analysis
    cy.task('log', JSON.stringify({
      type: 'ux-analysis-screenshot',
      name: screenshotName,
      testName,
      timestamp,
      viewport: Cypress.config('viewportWidth') + 'x' + Cypress.config('viewportHeight'),
      url: window.location.href,
      userAgent: navigator.userAgent.includes('Headless') ? 'headless' : 'headed'
    }));
  }
  
  static captureBeforeAfter(actionName) {
    this.captureForAnalysis(`${actionName}-before`);
    return {
      after: () => this.captureForAnalysis(`${actionName}-after`)
    };
  }
  
  static captureUXFlow(flowName, stepName) {
    this.captureForAnalysis(`${flowName}-${stepName}`);
  }
  
  static captureDarkModeComparison(pageName) {
    // Light mode
    cy.switchTheme('light');
    this.captureForAnalysis(`${pageName}-light-mode`);
    
    // Dark mode
    cy.switchTheme('dark');
    this.captureForAnalysis(`${pageName}-dark-mode`);
  }
  
  static captureResponsiveViews(pageName) {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 1024, height: 768, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ];
    
    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height);
      cy.wait(500); // Let the UI adjust
      this.captureForAnalysis(`${pageName}-${viewport.name}`);
    });
    
    // Reset to default
    cy.viewport(1280, 720);
  }
}

// Add custom command
Cypress.Commands.add('captureForClaudeAnalysis', (testName, options) => {
  ScreenshotHelper.captureForAnalysis(testName, options);
});

Cypress.Commands.add('captureUXFlow', (flowName, stepName) => {
  ScreenshotHelper.captureUXFlow(flowName, stepName);
});

Cypress.Commands.add('captureDarkModeComparison', (pageName) => {
  ScreenshotHelper.captureDarkModeComparison(pageName);
});

Cypress.Commands.add('captureResponsiveViews', (pageName) => {
  ScreenshotHelper.captureResponsiveViews(pageName);
});

export default ScreenshotHelper;