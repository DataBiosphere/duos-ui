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
    clearMocks: true,
    css: true,
    environment: 'jsdom',
    exclude: ['build/**', 'cypress/**', 'node_modules/**', 'server/**'],
    globals: true,
    include: ['test/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['./test/setup.ts'],
    unstubGlobals: true,
  },
})
