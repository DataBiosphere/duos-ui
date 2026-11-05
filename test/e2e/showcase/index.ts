/**
 * A synthetic showcase index for the Playwright specs (DT-4424). `pnpm run build:e2e` sets
 * DUOS_E2E_SHOWCASES, and `vite.config.ts` then resolves `src/showcases` to this module instead of
 * the real index. No other build sets that variable, so these entries never reach a deployed build
 * (`test/showcases/e2eShowcases.spec.ts` checks both).
 *
 * The content is fictional. It passes the same schema and CI-guard rules as a real entry.
 */
import { showcaseRoute } from '../../../src/showcases/index'
import type { RegistryEntry, ShowcasePartialInput } from 'src/types/showcase'

export const E2E_FLAGSHIP: RegistryEntry = { key: 'e2e-flagship', title: 'Synthetic Flagship Data', status: 'live', flagship: true, order: 0 }
export const E2E_PARTNER: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }
export const E2E_HIDDEN: RegistryEntry = { key: 'e2e-hidden', title: 'Hidden Synthetic Data', status: 'hidden', flagship: false, order: 2 }

export const showcaseEntries: readonly RegistryEntry[] = [E2E_FLAGSHIP, E2E_PARTNER, E2E_HIDDEN]

export const retiredShowcaseKeys: readonly string[] = []

export const showcaseConfigs: Readonly<Record<string, ShowcasePartialInput>> = {
  // The guard rejects an enabled section with no renderer yet, so these set branding only; each
  // section PR (S3.3 onward) turns its section on here along with its Playwright checks.
  'e2e-flagship': {},
  'quillmere': { branding: { theme: 'teal' } },
  'e2e-hidden': {},
}

export { showcaseRoute }
