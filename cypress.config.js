const { defineConfig } = require('cypress');

module.exports = defineConfig({
  chromeWebSecurity: false,
  env: {
    baseUrl: 'http://localhost:3000/',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    baseUrl: 'http://localhost:3000/',
  },
  component: {
    src: ['./src/components/common', './cypress/component/'],
    specPattern: ['**/*.spec.js', '**/*.spec.ts', '**/*.spec.tsx'],
    devServer: {
      framework: 'create-react-app',
      bundler: 'webpack',
    },
  },
});
