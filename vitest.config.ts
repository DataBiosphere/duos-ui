import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { aliases_from_tsconfig } from './aliases'

export default defineConfig({
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  assetsInclude: ['**/*.md'],
  // Vitest externalizes node_modules and never consumes Vite's pre-bundled deps,
  // so the automatic dependency scan is wasted work. It also races with server
  // teardown on `--merge-reports` runs (no test files to keep the server alive),
  // which logged a spurious "Failed to run dependency scan" error in CI.
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },
  resolve: {
    alias: aliases_from_tsconfig(),
  },
  test: {
    css: false,
    globals: true,
    environment: 'jsdom',
    pool: 'vmThreads',
    include: ['test/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    exclude: ['test/browser/**', 'test/e2e/**', 'build/**', 'node_modules/**', 'server/**'],
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'json'],
    },
  },
})
