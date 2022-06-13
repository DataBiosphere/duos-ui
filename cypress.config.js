const { defineConfig } = require('cypress');

module.exports = defineConfig({
  chromeWebSecurity: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    baseUrl: 'http://localhost:3000/',
  },
  component: {
    setupNodeEvents(on, config) {},
    src: ['./src/components/common', './cypress/component/'],
    specPattern: '**/*.spec.js',
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
});
