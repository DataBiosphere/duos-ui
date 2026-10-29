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
 * Every section is off by default, the computed shelves included: a partner turns a section on in its
 * own config, so its ranking and scope are reviewed and approved in that partner's PR.
 */
import { SECTION_KEYS, type ShowcaseConfigInput, type ShowcasePartialInput } from 'src/types/showcase'

type Sections = ShowcaseConfigInput['sections']

const OFF = { enabled: false } as const

const defaultSections: Sections = {
  'masthead': OFF,
  'hero': OFF,
  'latest-data-releases': OFF,
  'most-requested-datasets': OFF,
  'largest-cohorts': OFF,
  'open-access-datasets': OFF,
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
}

export const defaultShowcase: Readonly<ShowcaseConfigInput> = {
  schemaVersion: 1,
  branding: { theme: 'default' },
  sections: defaultSections,
}

/** The fields of `value` that are set, so an explicit `undefined` can't erase a default. */
const setFields = <T extends object>(value: T | undefined): Partial<T> =>
  Object.fromEntries(Object.entries(value ?? {}).filter(([, field]) => field !== undefined)) as Partial<T>

/** The full config for a partner's overrides. Unknown keys are kept, after the known ones, so the
 * CI guard reports a misspelt section instead of the merge dropping it silently. A field set to
 * `undefined` keeps the default. The result is a copy that shares no objects with the defaults or the
 * partner config, so changing it can't change either.
 *
 * `defaults` is for tests only. The CI guard checks each entry resolved over `defaultShowcase`, so
 * page code must use the default; resolving over anything else renders a config CI never checked. */
export const resolveShowcase = (partial: ShowcasePartialInput, defaults: Readonly<ShowcaseConfigInput> = defaultShowcase): ShowcaseConfigInput => {
  const sections = partial.sections ?? {}
  // Each section is copied on its own: `structuredClone` keeps shared references inside one copy,
  // and every default section is the same `OFF` object, so one clone of the whole would still link them.
  const known = Object.fromEntries(SECTION_KEYS.map(key => [key, structuredClone(sections[key] ?? defaults.sections[key])]))
  const unknown = Object.fromEntries(Object.entries(sections)
    .filter(([key]) => !(SECTION_KEYS as readonly string[]).includes(key))
    .map(([key, section]) => [key, structuredClone(section)]))
  return structuredClone({
    ...defaults,
    ...setFields(partial),
    branding: { ...defaults.branding, ...setFields(partial.branding) },
    sections: { ...known, ...unknown } as Sections,
  })
}
