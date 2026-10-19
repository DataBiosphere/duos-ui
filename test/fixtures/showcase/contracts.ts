/**
 * Data Showcase contract fixtures for DT-4272 (S1.1). All values are synthetic placeholders.
 *
 * The types are provisional: S1.2 (DT-4273) replaces them with `src/types/showcase.ts`, and S2.1
 * (DT-4274) finalizes the lookup field names and `scope` vocabulary. The decisions behind them are
 * recorded in consent `docs/plans/data-showcase-contracts.md`.
 *
 * Two copies exist: consent `docs/plans/data-showcase-fixtures.ts` (reference) and duos-ui
 * `test/fixtures/showcase/contracts.ts` (type-checked and tested). Keep them identical.
 */

/** All 23 registry keys, in fixed render order. */
export const SECTION_KEYS = [
  'masthead',
  'hero',
  'latest-data-releases',
  'most-requested-datasets',
  'largest-cohorts',
  'open-access-datasets',
  'instant-approval',
  'datasets-at-a-glance',
  'datasets-moving-to-archive',
  'featured-tools',
  'new-workflow-tools',
  'notebooks',
  'ai-models',
  'featured-workspaces',
  'latest-published-science',
  'research-area',
  'research-initiative',
  'program-impact',
  'community-conference',
  'where-else',
  'training-workshops',
  'scholars-program',
  'tech-policy-interns',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

/** The only section types that can be enabled in the MVP. */
export const MVP_SECTION_KEYS: readonly SectionKey[] = [
  'masthead',
  'hero',
  'latest-data-releases',
  'open-access-datasets',
  'featured-tools',
  'featured-workspaces',
]

/** A dataset whose `availableDate` is at most this many days old shows the "New in DUOS" badge. */
export const NEW_IN_DUOS_BADGE_DAYS = 30

/** `YYYY-MM-DD`. */
type DateString = string
/** `https://` URL or a same-origin path beginning with exactly one `/`. */
type SafeUrl = string
/** Production `DUOS-` identifier. */
type DuosIdentifier = string

interface Link { label: string, url: SafeUrl }
interface Image { src: string, alt: string }

/** Fields every section type accepts. */
interface SectionCommon {
  title?: string
  subtitle?: string
  navLabel?: string
  cta?: Link
  seeAllUrl?: SafeUrl
}

/** A disabled section needs only `enabled: false`. */
type Section<T> = { enabled: false } | ({ enabled: true } & SectionCommon & T)

export type Ranking = 'newest' | 'most-requested' | 'largest-cohort' | 'instant-eligible' | 'archive-soonest'

/** Provisional until S2.1 agrees the scope vocabulary. */
export interface Scope { dac?: string[] }

/** Dataset sections are editorial (`items`) or computed (`ranking`), never both. */
type DatasetShelf
  = | { items: DuosIdentifier[], ranking?: never }
    | { ranking: Ranking, scope?: Scope, limit?: number, pin?: DuosIdentifier[], exclude?: DuosIdentifier[], items?: never }

/** Hero stats are computed live. `studies` and `datasets` come from the lookup `stats` mode; `tools`
 * counts the enabled `featured-tools` and `featured-workspaces` items in the showcase config. */
type HeroStat = 'studies' | 'datasets' | 'tools'

interface Announcement { id: string, text: string, url: SafeUrl, startDate: DateString, endDate: DateString }

/** Story 29 item form for tools, workflows, notebooks, models and workspaces. */
interface ResourceItem {
  id: string
  name: string
  description: string
  tags: string[]
  thumbnail?: Image
  launchUrl: SafeUrl
  docsUrl?: SafeUrl
}

interface PublicationItem { id: string, citation: string, summary: string, url: SafeUrl, year: number }

interface GroupingItem { id: string, label: string, description: string, icon?: Image, destinationUrl: SafeUrl }

/** Program panels: `description` is Markdown rendered without raw HTML. */
interface ProgramPanel { description: string, ctas: Link[] }

export interface SectionConfigs {
  'masthead': Section<{ logos: (Image & { url?: SafeUrl })[] }>
  'hero': Section<{ intro: string, stats: HeroStat[], announcements: Announcement[], onboarding: Link[], primaryCtas: Link[] }>
  'latest-data-releases': Section<{ ranking: 'newest', scope?: Scope, limit?: number, pin?: DuosIdentifier[], exclude?: DuosIdentifier[] }>
  'most-requested-datasets': Section<DatasetShelf>
  'largest-cohorts': Section<DatasetShelf>
  'open-access-datasets': Section<{ items: DuosIdentifier[] } | { ranking: 'newest', scope?: Scope, limit?: number, pin?: DuosIdentifier[], exclude?: DuosIdentifier[] }>
  'instant-approval': Section<DatasetShelf>
  'datasets-at-a-glance': Section<{ charts: ('disease-area' | 'data-type' | 'access-type')[], scope: 'curated' | 'full-catalog' }>
  'datasets-moving-to-archive': Section<DatasetShelf>
  'featured-tools': Section<{ items: (ResourceItem & { featured?: boolean })[] }>
  'new-workflow-tools': Section<{ items: ResourceItem[] }>
  'notebooks': Section<{ items: ResourceItem[] }>
  'ai-models': Section<{ items: ResourceItem[] }>
  'featured-workspaces': Section<{ items: ResourceItem[] }>
  'latest-published-science': Section<{ items: PublicationItem[], selfReportPrompt: boolean }>
  'research-area': Section<{ items: GroupingItem[] }>
  'research-initiative': Section<{ items: GroupingItem[] }>
  'program-impact': Section<{ embedUrl?: SafeUrl, attribution: string, statBanner: { label: string, value: string }[] }>
  'community-conference': Section<{
    startDate: DateString
    endDate: DateString
    location: string
    description: string
    registration: { state: 'open', url: SafeUrl } | { state: 'alert-signup' }
  }>
  'where-else': Section<ProgramPanel>
  'training-workshops': Section<ProgramPanel>
  'scholars-program': Section<ProgramPanel>
  'tech-policy-interns': Section<ProgramPanel>
}

export interface ShowcaseConfig {
  schemaVersion: 1
  branding: { theme: string }
  sections: { [K in SectionKey]: SectionConfigs[K] }
}

/** The 17 reserved, non-MVP types: present in every config, disabled. */
const RESERVED_DISABLED = {
  'most-requested-datasets': { enabled: false },
  'largest-cohorts': { enabled: false },
  'instant-approval': { enabled: false },
  'datasets-at-a-glance': { enabled: false },
  'datasets-moving-to-archive': { enabled: false },
  'new-workflow-tools': { enabled: false },
  'notebooks': { enabled: false },
  'ai-models': { enabled: false },
  'latest-published-science': { enabled: false },
  'research-area': { enabled: false },
  'research-initiative': { enabled: false },
  'program-impact': { enabled: false },
  'community-conference': { enabled: false },
  'where-else': { enabled: false },
  'training-workshops': { enabled: false },
  'scholars-program': { enabled: false },
  'tech-policy-interns': { enabled: false },
} as const

const PLACEHOLDER = 'Placeholder copy; the product owner supplies the text.'

/** Flagship (`/data`): the whole catalog in scope; computed open-access shelf. */
export const flagshipConfig: ShowcaseConfig = {
  schemaVersion: 1,
  branding: { theme: 'default' },
  sections: {
    'masthead': { enabled: true, logos: [{ src: 'showcase/flagship/logo.svg', alt: 'DUOS' }] },
    'hero': {
      enabled: true,
      intro: PLACEHOLDER,
      stats: ['studies', 'datasets', 'tools'],
      announcements: [
        { id: 'announcement-1', text: PLACEHOLDER, url: '/datalibrary', startDate: '2026-11-01', endDate: '2026-12-01' },
      ],
      onboarding: [{ label: 'Get started', url: 'https://example.org/get-started' }],
      primaryCtas: [{ label: 'Search the Data Library', url: '/datalibrary' }],
    },
    'latest-data-releases': { enabled: true, ranking: 'newest', limit: 12 },
    'most-requested-datasets': RESERVED_DISABLED['most-requested-datasets'],
    'largest-cohorts': RESERVED_DISABLED['largest-cohorts'],
    'open-access-datasets': { enabled: true, ranking: 'newest', limit: 12 },
    'instant-approval': RESERVED_DISABLED['instant-approval'],
    'datasets-at-a-glance': RESERVED_DISABLED['datasets-at-a-glance'],
    'datasets-moving-to-archive': RESERVED_DISABLED['datasets-moving-to-archive'],
    'featured-tools': {
      enabled: true,
      items: [
        { id: 'tool-1', name: 'Example Platform', description: PLACEHOLDER, tags: ['analysis'], launchUrl: 'https://example.org/launch', docsUrl: 'https://example.org/docs', featured: true },
        { id: 'tool-2', name: 'Example Viewer', description: PLACEHOLDER, tags: ['visualization'], launchUrl: 'https://example.org/viewer' },
      ],
    },
    'new-workflow-tools': RESERVED_DISABLED['new-workflow-tools'],
    'notebooks': RESERVED_DISABLED['notebooks'],
    'ai-models': RESERVED_DISABLED['ai-models'],
    'featured-workspaces': {
      enabled: true,
      items: [
        { id: 'workspace-1', name: 'Example Starter Workspace', description: PLACEHOLDER, tags: ['GWAS'], launchUrl: 'https://example.org/workspace' },
      ],
    },
    'latest-published-science': RESERVED_DISABLED['latest-published-science'],
    'research-area': RESERVED_DISABLED['research-area'],
    'research-initiative': RESERVED_DISABLED['research-initiative'],
    'program-impact': RESERVED_DISABLED['program-impact'],
    'community-conference': RESERVED_DISABLED['community-conference'],
    'where-else': RESERVED_DISABLED['where-else'],
    'training-workshops': RESERVED_DISABLED['training-workshops'],
    'scholars-program': RESERVED_DISABLED['scholars-program'],
    'tech-policy-interns': RESERVED_DISABLED['tech-policy-interns'],
  },
}

/** Partner (`/showcase/example-partner`): DAC scope, editorial open-access shelf, two sections off. */
export const partnerConfig: ShowcaseConfig = {
  ...flagshipConfig,
  branding: { theme: 'blue' },
  sections: {
    ...flagshipConfig.sections,
    'masthead': { enabled: true, logos: [{ src: 'showcase/example-partner/logo.svg', alt: 'Example Partner', url: 'https://example.org' }] },
    'latest-data-releases': { enabled: true, ranking: 'newest', scope: { dac: ['Example DAC'] }, limit: 12, pin: ['DUOS-000789'], exclude: ['DUOS-000111'] },
    'open-access-datasets': { enabled: true, items: ['DUOS-000123', 'DUOS-000456'] },
    'featured-tools': { enabled: false },
    'featured-workspaces': { enabled: false },
  },
}

// Lookup contract: POST /showcase/datasets (consent), proxied by the BFF as
// POST /public/showcase/datasets. Field names are provisional until S2.1.

export type LookupRequest
  = | { mode: 'identifiers', section: SectionKey, identifiers: DuosIdentifier[] }
    | { mode: 'ranking', section: SectionKey, ranking: Ranking, scope?: Scope, limit?: number, pin?: DuosIdentifier[], exclude?: DuosIdentifier[] }
    | { mode: 'all', pageSize?: number, cursor?: string }
    | { mode: 'stats', scope?: Scope }

export interface DatasetSummary {
  identifier: DuosIdentifier
  title: string
  accessManagement: 'open' | 'controlled' | 'external'
  dacName: string | null
  participantCount: number | null
  /** "New in DUOS" date: `dac_approval_date` (controlled) or `create_date` (open/external). */
  availableDate: DateString | null
}

export interface UnavailableResult { identifier: DuosIdentifier, status: 'unavailable' }

export type LookupResponse
  = | { datasets: (DatasetSummary | UnavailableResult)[] }
    | { datasets: DatasetSummary[], nextCursor: string | null }
    | { studyCount: number, datasetCount: number }

export const lookupExamples: { name: string, request: LookupRequest, status: number, response: LookupResponse | { message: string } }[] = [
  {
    name: 'identifiers: one eligible, one unavailable (private and nonexistent look the same)',
    request: { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000123', 'DUOS-000999'] },
    status: 200,
    response: {
      datasets: [
        { identifier: 'DUOS-000123', title: 'Example Open Cohort', accessManagement: 'open', dacName: null, participantCount: 1200, availableDate: '2026-10-02' },
        { identifier: 'DUOS-000999', status: 'unavailable' },
      ],
    },
  },
  {
    name: 'ranking: newest within a DAC scope, eligible pin first, exclusion removed',
    request: { mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', scope: { dac: ['Example DAC'] }, limit: 12, pin: ['DUOS-000789'], exclude: ['DUOS-000111'] },
    status: 200,
    response: {
      datasets: [
        { identifier: 'DUOS-000789', title: 'Example Cohort', accessManagement: 'controlled', dacName: 'Example DAC', participantCount: 5400, availableDate: '2026-09-30' },
        { identifier: 'DUOS-000790', title: 'Example Follow-up Cohort', accessManagement: 'controlled', dacName: 'Example DAC', participantCount: null, availableDate: '2026-10-05' },
      ],
    },
  },
  {
    name: 'all: first page of the public catalog',
    request: { mode: 'all', pageSize: 100 },
    status: 200,
    response: {
      datasets: [
        { identifier: 'DUOS-000123', title: 'Example Open Cohort', accessManagement: 'open', dacName: null, participantCount: 1200, availableDate: '2026-10-02' },
      ],
      nextCursor: null,
    },
  },
  {
    name: 'stats: counts of eligible datasets and their studies in the scope; no scope means the whole catalog',
    request: { mode: 'stats', scope: { dac: ['Example DAC'] } },
    status: 200,
    response: { studyCount: 14, datasetCount: 37 },
  },
  {
    name: 'rejected: field not allowed in this mode',
    request: { mode: 'stats', limit: 12 } as unknown as LookupRequest,
    status: 400,
    response: { message: 'Unrecognized field "limit" for mode "stats"' },
  },
]
