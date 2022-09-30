const { defineConfig } = require('cypress');

module.exports = defineConfig({
  chromeWebSecurity: false,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    baseUrl: 'https://local.broadinstitute.org:3000/',
  },
  component: {
    src: ['./src/components/common', './cypress/component/'],
    specPattern: '**/*.spec.js',
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
});
