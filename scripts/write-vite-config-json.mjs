// Generates the minimal vite.config.json that @fastify/vite reads in production
// to locate the static build output. Normally written by the viteFastify() Vite
// plugin, but we skip that plugin to keep the build output in build/ rather than
// the plugin's default build/client/.
import { writeFileSync } from 'node:fs'

writeFileSync(
  'build/vite.config.json',
  JSON.stringify(
    {
      base: '/',
      build: { assetsDir: 'assets', outDir: 'build' },
      fastify: { outDirs: { client: 'build' } },
    },
    null,
    2,
  ),
)
