import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { aliases_from_tsconfig } from './aliases'

export default defineConfig({
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  assetsInclude: ['**/*.md'],
  resolve: {
    alias: aliases_from_tsconfig(),
  },
  test: {
    css: false,
    globals: true,
    environment: 'jsdom',
    pool: 'vmThreads',
    setupFiles: ['./test/setup.ts'],
    // Vitest's 5s default is a wall-clock budget. Under heavy CI load, render-heavy
    // tests exhaust it and fail without any defect; worse, an abandoned test's pending
    // userEvent keystrokes then bleed into the next test. Give tests real headroom.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['test/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    exclude: ['test/browser/**', 'test/e2e/**', 'build/**', 'node_modules/**', 'server/**'],
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'json'],
    },
  },
})
