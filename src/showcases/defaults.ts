/**
 * Shared showcase defaults (DT-4276, S1.3). A partner config lists only what differs from
 * `defaultShowcase`; `resolveShowcase` fills in the rest (delivery plan section 3).
 *
 * The merge is key by key within `sections`: a section the partner lists replaces the default
 * section whole, so a partner never inherits fields from a section variant it didn't choose (such as
 * the editorial shelf's `ranking` next to its own `items`). `branding` merges field by field, so a
 * partner can override just a colour. Every key stays present, in fixed order.
 *
 * The defaults are structure only: no titles, nav labels or copy, which the product owner supplies.
 * The computed newest-first shelves need no partner content, so they are on by default once their
 * renderers are implemented (the CI guard rejects an enabled section without one). Every other
 * section is off until a partner config turns it on with its content.
 */
import { IMPLEMENTED_SECTION_KEYS, SECTION_KEYS, type SectionKey, type ShowcaseConfigInput, type ShowcasePartialInput } from 'src/types/showcase'

type Sections = ShowcaseConfigInput['sections']

const OFF = { enabled: false } as const

const NEWEST = { enabled: true, ranking: 'newest', limit: 12 } as const

/** The default sections when `implemented` lists the section types that have a renderer. */
export const defaultSectionsFor = (implemented: readonly SectionKey[]): Sections => ({
  'masthead': OFF,
  'hero': OFF,
  'latest-data-releases': implemented.includes('latest-data-releases') ? NEWEST : OFF,
  'most-requested-datasets': OFF,
  'largest-cohorts': OFF,
  'open-access-datasets': implemented.includes('open-access-datasets') ? NEWEST : OFF,
  'instant-approval': OFF,
  'datasets-at-a-glance': OFF,
  'datasets-moving-to-archive': OFF,
  'featured-tools': OFF,
  'new-workflow-tools': OFF,
  'notebooks': OFF,
  'ai-models': OFF,
  'featured-workspaces': OFF,
  'latest-published-science': OFF,
  'research-area': OFF,
  'research-initiative': OFF,
  'program-impact': OFF,
  'community-conference': OFF,
  'where-else': OFF,
  'training-workshops': OFF,
  'scholars-program': OFF,
  'tech-policy-interns': OFF,
})

export const defaultShowcase: Readonly<ShowcaseConfigInput> = {
  schemaVersion: 1,
  branding: { theme: 'default' },
  sections: defaultSectionsFor(IMPLEMENTED_SECTION_KEYS),
}

/** The full config for a partner's overrides. Unknown keys are kept, after the known ones, so the
 * CI guard reports a misspelt section instead of the merge dropping it silently. */
export const resolveShowcase = (partial: ShowcasePartialInput): ShowcaseConfigInput => {
  const sections = partial.sections ?? {}
  const known = Object.fromEntries(SECTION_KEYS.map(key => [key, sections[key] ?? defaultShowcase.sections[key]]))
  const unknown = Object.fromEntries(Object.entries(sections).filter(([key]) => !(SECTION_KEYS as readonly string[]).includes(key)))
  return {
    ...defaultShowcase,
    ...partial,
    branding: { ...defaultShowcase.branding, ...partial.branding },
    sections: { ...known, ...unknown } as Sections,
  }
}
