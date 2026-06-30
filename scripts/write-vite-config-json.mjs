// Generates the minimal vite.config.json that @fastify/vite reads in production
// to locate the static build output. Normally written by the viteFastify() Vite
// plugin, but we skip that plugin to keep the build output in build/ rather than
// the plugin's default build/client/.
import { writeFileSync } from 'node:fs'

// process.cwd() is the project root at build time (e.g. /usr/src/app in Docker).
// @fastify/vite calls resolveClientModule(viteConfig.root) to find an index.{ext}
// entry file; pointing it at the project root causes it to return null (no such
// file exists there), which is correct for pure SPA mode.
writeFileSync(
  'build/vite.config.json',
  JSON.stringify(
    {
      root: process.cwd(),
      base: '/',
      build: { assetsDir: 'assets', outDir: 'build' },
      fastify: { outDirs: { client: 'build' } },
    },
    null,
    2,
  ),
)
