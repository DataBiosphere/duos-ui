import { defineConfig } from 'cypress'

export default defineConfig({
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
    specPattern: ['**/*.spec.js', '**/*.spec.jsx', '**/*.spec.ts', '**/*.spec.tsx'],
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
