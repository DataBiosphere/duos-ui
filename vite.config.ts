import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { aliases_from_tsconfig } from './aliases'

const defaultOptions = {
  host: 'local.dsde-dev.broadinstitute.org',
  port: 3000,
  https: (process.env.CI || process.env.CYPRESS)
    ? undefined
    : {
        key: 'server.key',
        cert: 'server.crt',
      },
  open: true,
}

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
  server: defaultOptions,
  preview: defaultOptions,
  resolve: {
    alias: aliases_from_tsconfig(),
  },
})
