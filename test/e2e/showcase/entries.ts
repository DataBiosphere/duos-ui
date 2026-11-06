/**
 * The synthetic registry entries (DT-4424). `index.ts` serves them in the e2e build, and
 * `showcase.spec.ts` imports them from here: the index also re-exports the real index's
 * `showcaseRoute`, which loads `registry.json`, and Playwright's loader can't import JSON without an
 * import attribute.
 */
import type { RegistryEntry } from 'src/types/showcase'

export const E2E_FLAGSHIP: RegistryEntry = { key: 'e2e-flagship', title: 'Synthetic Flagship Data', status: 'live', flagship: true, order: 0 }
export const E2E_PARTNER: RegistryEntry = { key: 'quillmere', title: 'Quillmere Data Showcase', status: 'live', flagship: false, order: 1 }
export const E2E_HIDDEN: RegistryEntry = { key: 'e2e-hidden', title: 'Hidden Synthetic Data', status: 'hidden', flagship: false, order: 2 }
