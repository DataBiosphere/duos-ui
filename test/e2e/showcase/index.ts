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
  // The hero is S3.3. Its announcement dates are wide, so the build doesn't go stale.
  'quillmere': {
    branding: { theme: 'teal' },
    sections: {
      'hero': {
        enabled: true,
        subtitle: 'A synthetic partner showcase',
        intro: 'Fictional cohorts for testing the showcase template.',
        stats: [],
        primaryCtas: [{ label: 'Browse the data library', url: '/datalibrary' }, { label: 'About DUOS', url: '/' }],
        // Hidden until a workspaces shelf renders (S3.4).
        onboarding: [{ label: 'Start in a workspace', url: '#featured-workspaces' }],
        announcements: [
          { id: 'one', text: 'First synthetic announcement', url: 'https://example.org/one', startDate: '2026-01-01', endDate: '2099-12-31' },
          { id: 'two', text: 'Second synthetic announcement', url: 'https://example.org/two', startDate: '2026-01-01', endDate: '2099-12-31' },
        ],
      },
      // S3.3. The spec stubs its lookup, so the shelf doesn't depend on the catalog it reaches.
      'latest-data-releases': { enabled: true, ranking: 'newest' },
      // S3.3, curated. The spec stubs its lookup too.
      'open-access-datasets': { enabled: true, items: ['DUOS-000902'] },
      // S3.4. The featured app is listed second, so the spec checks that it still comes first.
      'featured-tools': {
        enabled: true,
        items: [
          { id: 'app-viewer', name: 'Synthetic Viewer', description: 'A fictional data viewer.', tags: ['visualization'], launchUrl: 'https://example.org/viewer' },
          { id: 'app-notebooks', name: 'Synthetic Notebooks', description: 'A fictional notebook service.', tags: ['analysis'], launchUrl: 'https://example.org/notebooks', docsUrl: 'https://example.org/notebooks/docs', featured: true },
          // A public DUOS path, so its link opens whether or not this build turns the handoffs on.
          { id: 'app-status', name: 'DUOS status', description: 'The DUOS status page.', tags: [], launchUrl: '/status' },
        ],
      },
    },
  },
  'e2e-hidden': {},
}

export { showcaseRoute } from '../../../src/showcases/index'
