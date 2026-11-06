/**
 * A synthetic showcase index for the Playwright specs (DT-4424). `pnpm run build:e2e` sets
 * DUOS_E2E_SHOWCASES, and `vite.config.ts` then resolves `src/showcases` to this module instead of
 * the real index. No other build sets that variable, so these entries never reach a deployed build
 * (`test/showcases/e2eShowcases.spec.ts` checks both).
 *
 * The content is fictional. It passes the same schema and CI-guard rules as a real entry.
 */
import type { RegistryEntry, ShowcasePartialInput } from 'src/types/showcase'
import { E2E_FLAGSHIP, E2E_HIDDEN, E2E_PARTNER } from './entries'

export { E2E_FLAGSHIP, E2E_HIDDEN, E2E_PARTNER }

export const showcaseEntries: readonly RegistryEntry[] = [E2E_FLAGSHIP, E2E_PARTNER, E2E_HIDDEN]

export const retiredShowcaseKeys: readonly string[] = []

export const showcaseConfigs: Readonly<Record<string, ShowcasePartialInput>> = {
  // The guard rejects an enabled section with no renderer yet, so each section PR turns its
  // section on here along with its Playwright checks. The masthead is S3.2 (showcaseHandoff.spec).
  'e2e-flagship': { sections: { masthead: { enabled: true, logos: [] } } },
  // The hero is S3.3.
  'quillmere': {
    branding: { theme: 'teal' },
    sections: {
      hero: {
        enabled: true,
        subtitle: 'A synthetic partner showcase',
        intro: 'Fictional cohorts for testing the showcase template.',
        stats: [],
        primaryCtas: [{ label: 'Browse the data library', url: '/datalibrary' }, { label: 'About DUOS', url: '/' }],
        // Hidden until a workspaces shelf renders (S3.4).
        onboarding: [{ label: 'Start in a workspace', url: '#featured-workspaces' }],
        announcements: [],
      },
    },
  },
  'e2e-hidden': {},
}

export { showcaseRoute } from '../../../src/showcases/index'
