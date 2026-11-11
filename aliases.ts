import { resolve } from 'node:path'
import tsconfig from './tsconfig.json'

/**
 * Keep Vite's module resolution aliases in sync with `tsconfig` path mappings.
 * Without this, imports that TypeScript accepts (via `paths`) can fail at
 * runtime/build because Vite would not know how to resolve the same aliases.
 */
export const aliases_from_tsconfig = () => {
  const paths: Record<string, string[]> = tsconfig.compilerOptions.paths
  const aliases: Record<string, string> = {}
  for (const [key, value] of Object.entries(paths)) {
    const aliasKey = key.replace(/\/\*$/, '')
    const aliasPath = resolve(__dirname, value[0].replace(/\/\*$/, ''))
    aliases[aliasKey] = aliasPath
  }
  return aliases
}

/**
 * Set by `pnpm run build:e2e` (DT-4424), and by hand with `pnpm start` for the local request-flow test
 * (DT-4358). No deployed build sets it.
 */
export const E2E_SHOWCASES_ENV = 'DUOS_E2E_SHOWCASES'

/**
 * With DUOS_E2E_SHOWCASES=true, resolves the bare `src/showcases` import to the synthetic index the
 * Playwright specs load. Anything else returns no alias, so the real index is built.
 */
export const e2eShowcaseAliases = (env: Readonly<Record<string, string | undefined>> = process.env) =>
  env[E2E_SHOWCASES_ENV] === 'true'
    ? [{ find: /^src\/showcases$/, replacement: resolve(__dirname, 'test/e2e/showcase/index.ts') }]
    : []
