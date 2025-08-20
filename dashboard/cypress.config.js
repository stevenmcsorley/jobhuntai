const { defineConfig } = require('cypress');
const { addCucumberPreprocessorPlugin } = require('@badeball/cypress-cucumber-preprocessor');
const createBundler = require('@bahmutov/cypress-esbuild-preprocessor');
const { createEsbuildPlugin } = require('@badeball/cypress-cucumber-preprocessor/esbuild');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3001',
    specPattern: 'cypress/e2e/**/*.feature',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    async setupNodeEvents(on, config) {
      // Implement cucumber preprocessor
      await addCucumberPreprocessorPlugin(on, config);
      
      // Setup file preprocessor with esbuild
      on('file:preprocessor', 
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );
      
      // Screenshot tasks for Claude Code analysis
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        
        // Custom task to capture full page screenshots
        captureFullPageScreenshot({ name, path }) {
          return new Promise((resolve) => {
            // This will be handled by Cypress screenshot commands
            resolve(`Screenshot captured: ${name}`);
          });
        }
      });
      
      // Note: uncaught:exception handling is done in e2e.js support file
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
});