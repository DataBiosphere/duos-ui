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
