import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import tsconfig from './tsconfig.json'

function aliases_from_tsconfig() {
  const paths: Record<string, string[]> = tsconfig.compilerOptions.paths
  const aliases: Record<string, string> = {}
  for (const [key, value] of Object.entries(paths)) {
    const aliasKey = key.replace(/\/\*$/, '')
    const aliasPath = resolve(__dirname, value[0].replace(/\/\*$/, ''))
    aliases[aliasKey] = aliasPath
  }
  return aliases
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
  server: {
    host: 'local.dsde-dev.broadinstitute.org',
    port: 3000,
    https: (process.env.CI || process.env.CYPRESS)
      ? undefined
      : {
          key: 'server.key',
          cert: 'server.crt',
        },
    open: true,
  },
  resolve: {
    alias: aliases_from_tsconfig(),
  },
})
