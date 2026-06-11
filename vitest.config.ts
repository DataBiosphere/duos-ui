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
    css: true,
    globals: true,
    environment: 'jsdom',
    include: ['test/**/*.{spec,test}.{js,jsx,ts,tsx}'],
    exclude: ['build/**', 'cypress/**', 'node_modules/**', 'server/**'],
    coverage: {
      provider: 'v8',
      reporter: ['cobertura'],
    },
  },
})
