import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { aliases_from_tsconfig } from './aliases'

export default defineConfig({
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  assetsInclude: ['**/*.md'],
  // Vitest turns off dependency discovery for the `client` and `ssr` environments,
  // but skips the `__vitest_vm__` environment that `pool: 'vmThreads'` adds, so that
  // one still scans `index.html` on every run. The scan is wasted work: Vitest
  // externalizes node_modules and never consumes Vite's pre-bundled deps. It also
  // races with server teardown on `--merge-reports` runs, where no test files keep
  // the server alive, and logged a spurious "Failed to run dependency scan" in CI.
  environments: {
    __vitest_vm__: {
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
    },
  },
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
