import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['test/**/*.{spec,test}.{js,ts}'],
    env: {
      FASTIFY_LOG_LEVEL: 'silent',
    },
    coverage: {
      provider: 'v8',
      reporter: ['json-summary', 'json'],
    },
  },
})
