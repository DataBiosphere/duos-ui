import { defineConfig } from 'cypress'
import vitePreprocessor from 'cypress-vite'

export default defineConfig({
  chromeWebSecurity: false,
  env: {
    baseUrl: 'http://localhost:3000/',
  },
  e2e: {
    baseUrl: 'http://localhost:3000/',
    setupNodeEvents(on) {
      on('file:preprocessor', vitePreprocessor())
    },
  },
  component: {
    specPattern: ['**/*.spec.js', '**/*.spec.jsx', '**/*.spec.ts', '**/*.spec.tsx'],
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
