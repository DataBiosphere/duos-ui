import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { aliases_from_tsconfig } from './aliases'

const isCI = Boolean(process.env.CI)

// Shared by `vite` (pnpm start) and `vite preview` (pnpm run serve).
//
// These options are fully applied when Vite owns its own socket — i.e. `pnpm start`
// (standalone dev) and `pnpm run serve` (preview). When Vite runs in middlewareMode
// via @fastify/vite (`pnpm run start:server`), host/port/https/open are ignored
// because Fastify owns the socket and handles TLS + browser-open itself (server/src/index.ts).
// allowedHosts is the exception: Vite still enforces it in middleware mode to reject
// requests whose Host header doesn't match. All of this is inert in production builds.
const serverOptions = {
  // CI runners can't resolve the Broad local-dev hostname (and have no
  // browser to open); everything binds/waits on localhost:3000 there.
  host: isCI ? 'localhost' : 'local.dsde-dev.broadinstitute.org',
  port: 3000,
  https: isCI ? undefined : { key: 'server.key', cert: 'server.crt' },
  open: !isCI,
  allowedHosts: ['local.dsde-dev.broadinstitute.org'],
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
  server: serverOptions,
  preview: serverOptions,
  resolve: {
    alias: aliases_from_tsconfig(),
  },
})
