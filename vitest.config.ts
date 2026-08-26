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
    // NB: vmThreads leaks memory across test files (its VM contexts are never
    // released), so a full run grows unbounded and gets OOM-killed. Even with
    // poolOptions.vmThreads.memoryLimit the run still gets killed, so use the
    // standard threads pool, which runs the whole suite reliably.
    pool: 'threads',
    include: ['test/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    exclude: ['test/browser/**', 'test/e2e/**', 'build/**', 'node_modules/**', 'server/**'],
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'json'],
    },
  },
})
