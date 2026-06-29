import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { aliases_from_tsconfig } from './aliases'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
    (process.env.VISUALIZER_PLUGIN === 'true' && visualizer({ open: true, filename: 'build/stats.html' })),
  ],
  assetsInclude: ['**/*.md'],
  build: {
    outDir: 'build',
    target: 'es2022',
  },
  // Vite runs in middlewareMode via @fastify/vite — most server options are ignored.
  // allowedHosts is the exception: Vite still enforces it in middleware mode to block
  // requests whose Host header doesn't match. Only applies in dev; inert in production.
  server: { allowedHosts: ['local.dsde-dev.broadinstitute.org'] },
  resolve: {
    alias: aliases_from_tsconfig(),
  },
})
