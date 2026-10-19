/**
 * Data Showcase contract fixtures for DT-4272 (S1.1). All values are synthetic placeholders.
 *
 * The types are provisional: S1.2 (DT-4273) replaces them with `src/types/showcase.ts`, and S2.1
 * (DT-4274) finalizes the lookup field names and `scope` vocabulary. The decisions behind them are
 * recorded in consent `docs/plans/data-showcase-contracts.md`.
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

/** Sections whose items the hero `tools` stat counts. Workspaces are not tools. */
export const TOOL_SECTION_KEYS = ['featured-tools', 'new-workflow-tools', 'notebooks', 'ai-models'] as const

/** Rankings each computed dataset section accepts. */
export const SECTION_RANKINGS = {
  'latest-data-releases': ['newest'],
  'most-requested-datasets': ['most-requested'],
  'largest-cohorts': ['largest-cohort'],
  'open-access-datasets': ['newest'],
  'instant-approval': ['instant-eligible'],
  'datasets-moving-to-archive': ['archive-soonest'],
} as const

export type DatasetSectionKey = keyof typeof SECTION_RANKINGS
export type Ranking = (typeof SECTION_RANKINGS)[DatasetSectionKey][number]

/** Canonical identifier: `DUOS-` plus the alias zero-padded to six digits, never more padding.
 * Configs use it, and consent echoes it unchanged. */
export const DUOS_IDENTIFIER_PATTERN = /^DUOS-(\d{6}|[1-9]\d{6,})$/

/** A dataset whose `availableDate` is at most this many days before today (UTC) shows "New in DUOS".
 * Workflow items use the same window with their `addedDate`. */
export const NEW_BADGE_DAYS = 30

/** `YYYY-MM-DD` calendar date in UTC. Date ranges include both `startDate` and `endDate`. */
type DateString = `${number}-${number}-${number}`
/** `https://` URL, a same-origin path beginning with exactly one `/`, or `#<section key>` for a
 * same-page section. A `#` link is hidden when its target section isn't visible. The type admits
 * `//host` and `/\host`; the S1.2 CI guard and the renderer reject them. */
type SafeUrl = `https://${string}` | `/${string}` | `#${SectionKey}`
/** Production identifier matching `DUOS_IDENTIFIER_PATTERN`. */
type DuosIdentifier = `DUOS-${number}`

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

/** A disabled section may keep its content. */
type Section<T> = ({ enabled: false } & Partial<SectionCommon & T>) | ({ enabled: true } & SectionCommon & T)

/** Provisional until S2.1 agrees the scope vocabulary. */
export interface Scope { dac?: string[] }

/** Dataset sections are editorial (`items`) or computed (`ranking`), never both. */
type DatasetShelf<K extends DatasetSectionKey>
  = | { items: DuosIdentifier[], ranking?: never }
    | { ranking: (typeof SECTION_RANKINGS)[K][number], scope?: Scope, limit?: number, pin?: DuosIdentifier[], exclude?: DuosIdentifier[], items?: never }

/** Computed-only dataset sections: hand-curated rankings go stale (delivery plan section 3). Only
 * `open-access-datasets` may be editorial. */
type ComputedShelf<K extends DatasetSectionKey> = Extract<DatasetShelf<K>, { ranking: string }>

/** Hero stats are computed live; a stat whose value is 0 is hidden. `studies` and `datasets` come
 * from the lookup `stats` mode with the hero's `scope` (none: the whole public catalog). `tools`
 * counts the items in the enabled `TOOL_SECTION_KEYS` sections. */
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
  'hero': Section<{ intro: string, stats: HeroStat[], scope?: Scope, announcements: Announcement[], onboarding: Link[], primaryCtas: Link[] }>
  'latest-data-releases': Section<ComputedShelf<'latest-data-releases'>>
  'most-requested-datasets': Section<ComputedShelf<'most-requested-datasets'>>
  'largest-cohorts': Section<ComputedShelf<'largest-cohorts'>>
  'open-access-datasets': Section<DatasetShelf<'open-access-datasets'>>
  'instant-approval': Section<ComputedShelf<'instant-approval'>>
  /** `full-catalog` is flagship-only (current DT-3904 Story 13). */
  'datasets-at-a-glance': Section<{ charts: ('disease-area' | 'data-type' | 'access-type')[], scope: 'curated' | 'full-catalog' }>
  'datasets-moving-to-archive': Section<ComputedShelf<'datasets-moving-to-archive'>>
  'featured-tools': Section<{ items: (ResourceItem & { featured?: boolean })[] }>
  /** `addedDate` drives the "New" badge (original Story 15). */
  'new-workflow-tools': Section<{ items: (ResourceItem & { addedDate?: DateString })[] }>
  'notebooks': Section<{ items: ResourceItem[] }>
  'ai-models': Section<{ items: ResourceItem[] }>
  'featured-workspaces': Section<{ items: ResourceItem[] }>
  'latest-published-science': Section<{ items: PublicationItem[], selfReportPrompt: boolean }>
  'research-area': Section<{ items: GroupingItem[] }>
  'research-initiative': Section<{ items: GroupingItem[] }>
  /** Original Story 21: an embed, or a periodically refreshed snapshot of through.bio data, shown as
   * not live, with attribution. */
  'program-impact': Section<
    | { mode: 'embed', embedUrl: SafeUrl, attribution: string }
    | { mode: 'snapshot', snapshotDate: DateString, sourceUrl: SafeUrl, attribution: string, statBanner: { label: string, value: string }[] }
  >
  'community-conference': Section<{
    startDate: DateString
    endDate: DateString
    /** IANA time zone, e.g. `America/New_York`. */
    timezone: string
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

const OFF = { enabled: false } as const

const PLACEHOLDER = 'Placeholder copy; the product owner supplies the text.'

const HERO: Extract<SectionConfigs['hero'], { enabled: true }> = {
  enabled: true,
  intro: PLACEHOLDER,
  stats: ['studies', 'datasets', 'tools'],
  announcements: [
    { id: 'announcement-1', text: PLACEHOLDER, url: '/datalibrary', startDate: '2026-11-01', endDate: '2026-11-30' },
  ],
  // The `#featured-workspaces` link is the Story 18 cross-link; it is hidden where that section is off.
  onboarding: [
    { label: 'Get started', url: 'https://example.org/get-started' },
    { label: 'Starter workspaces', url: '#featured-workspaces' },
  ],
  primaryCtas: [{ label: 'Search the Data Library', url: '/datalibrary' }],
}

/** Flagship (`/data`): the whole catalog in scope; computed open-access shelf. */
export const flagshipConfig: ShowcaseConfig = {
  schemaVersion: 1,
  branding: { theme: 'default' },
  sections: {
    'masthead': { enabled: true, logos: [{ src: 'showcase/flagship/logo.svg', alt: 'DUOS' }] },
    'hero': HERO,
    'latest-data-releases': { enabled: true, ranking: 'newest', limit: 12 },
    'most-requested-datasets': OFF,
    'largest-cohorts': OFF,
    'open-access-datasets': { enabled: true, ranking: 'newest', limit: 12 },
    'instant-approval': OFF,
    'datasets-at-a-glance': OFF,
    'datasets-moving-to-archive': OFF,
    'featured-tools': {
      enabled: true,
      items: [
        { id: 'tool-1', name: 'Example Platform', description: PLACEHOLDER, tags: ['analysis'], launchUrl: 'https://example.org/launch', docsUrl: 'https://example.org/docs', featured: true },
        { id: 'tool-2', name: 'Example Viewer', description: PLACEHOLDER, tags: ['visualization'], launchUrl: 'https://example.org/viewer' },
      ],
    },
    'new-workflow-tools': OFF,
    'notebooks': OFF,
    'ai-models': OFF,
    'featured-workspaces': {
      enabled: true,
      items: [
        { id: 'workspace-1', name: 'Example Starter Workspace', description: PLACEHOLDER, tags: ['GWAS'], launchUrl: 'https://example.org/workspace' },
      ],
    },
    'latest-published-science': OFF,
    'research-area': OFF,
    'research-initiative': OFF,
    'program-impact': OFF,
    'community-conference': OFF,
    'where-else': OFF,
    'training-workshops': OFF,
    'scholars-program': OFF,
    'tech-policy-interns': OFF,
  },
}

/** Partner (`/showcase/example-partner`): DAC-scoped hero and releases, editorial open-access shelf,
 * tools and workspaces off, so its hero hides the `tools` stat and the workspaces link. */
export const partnerConfig: ShowcaseConfig = {
  ...flagshipConfig,
  branding: { theme: 'blue' },
  sections: {
    ...flagshipConfig.sections,
    'masthead': { enabled: true, logos: [{ src: 'showcase/example-partner/logo.svg', alt: 'Example Partner', url: 'https://example.org' }] },
    'hero': { ...HERO, scope: { dac: ['Example DAC'] } },
    'latest-data-releases': { enabled: true, ranking: 'newest', scope: { dac: ['Example DAC'] }, limit: 12, pin: ['DUOS-000789'], exclude: ['DUOS-000111'] },
    'open-access-datasets': { enabled: true, items: ['DUOS-000123', 'DUOS-000456'] },
    'featured-tools': { enabled: false },
    'featured-workspaces': { enabled: false },
  },
}

// Lookup contract: POST /showcase/datasets (consent), proxied by the BFF as
// POST /public/showcase/datasets. Field names are provisional until S2.1.

export type LookupRequest
  = | { mode: 'identifiers', section: DatasetSectionKey, identifiers: DuosIdentifier[] }
    | { [K in DatasetSectionKey]: { mode: 'ranking', section: K, ranking: (typeof SECTION_RANKINGS)[K][number], scope?: Scope, limit?: number, pin?: DuosIdentifier[], exclude?: DuosIdentifier[] } }[DatasetSectionKey]
    | { mode: 'all', pageSize?: number, cursor?: string }
    | { mode: 'stats', scope?: Scope }

export interface DatasetSummary {
  identifier: DuosIdentifier
  title: string
  /** `null` when the dataset has no recognized access management. */
  accessManagement: 'open' | 'controlled' | 'external' | null
  dacName: string | null
  /** Human-readable consent codes, e.g. `GRU`, `HMB`. */
  consentCodes: string[]
  participantCount: number | null
  /** "New in DUOS" date: `dac_approval_date` (controlled) or `create_date` (open/external). */
  availableDate: DateString | null
  /** Approved provider link for open and external datasets; `null` for controlled datasets, which
   * use the DUOS request handoff. */
  accessUrl: SafeUrl | null
}

export interface UnavailableResult { identifier: DuosIdentifier, status: 'unavailable' }

interface ErrorResponse { message: string }

/** Requestable tier (S2.1): the same rows a shelf can show. */
interface StatsResponse { studyCount: number, datasetCount: number }

export type LookupExample
  = | { name: string, request: Extract<LookupRequest, { mode: 'identifiers' }>, status: 200, response: { datasets: (DatasetSummary | UnavailableResult)[] } }
    | { name: string, request: Extract<LookupRequest, { mode: 'ranking' }>, status: 200, response: { datasets: DatasetSummary[] } }
    | { name: string, request: Extract<LookupRequest, { mode: 'all' }>, status: 200, response: { datasets: DatasetSummary[], nextCursor: string | null } }
    | { name: string, request: Extract<LookupRequest, { mode: 'stats' }>, status: 200, response: StatsResponse }
    | { name: string, request: unknown, status: 400 | 413, response: ErrorResponse }

const OPEN_COHORT: DatasetSummary = {
  identifier: 'DUOS-000123',
  title: 'Example Open Cohort',
  accessManagement: 'open',
  dacName: null,
  consentCodes: ['GRU'],
  participantCount: 1200,
  availableDate: '2026-10-02',
  accessUrl: 'https://example.org/open-cohort',
}

export const lookupExamples: LookupExample[] = [
  {
    name: 'identifiers: one eligible, one unavailable (private and nonexistent look the same)',
    request: { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-000123', 'DUOS-000999'] },
    status: 200,
    response: { datasets: [OPEN_COHORT, { identifier: 'DUOS-000999', status: 'unavailable' }] },
  },
  {
    name: 'ranking: newest within a DAC scope, eligible pin first, exclusion removed',
    request: { mode: 'ranking', section: 'latest-data-releases', ranking: 'newest', scope: { dac: ['Example DAC'] }, limit: 12, pin: ['DUOS-000789'], exclude: ['DUOS-000111'] },
    status: 200,
    response: {
      datasets: [
        { identifier: 'DUOS-000789', title: 'Example Cohort', accessManagement: 'controlled', dacName: 'Example DAC', consentCodes: ['HMB'], participantCount: 5400, availableDate: '2026-09-30', accessUrl: null },
        { identifier: 'DUOS-000790', title: 'Example Follow-up Cohort', accessManagement: 'controlled', dacName: 'Example DAC', consentCodes: ['GRU'], participantCount: null, availableDate: '2026-10-05', accessUrl: null },
      ],
    },
  },
  {
    name: 'all: first page of the public catalog',
    request: { mode: 'all', pageSize: 100 },
    status: 200,
    response: { datasets: [OPEN_COHORT], nextCursor: null },
  },
  {
    name: 'stats: the partner hero, using its scope; the flagship hero sends no scope (whole catalog)',
    request: { mode: 'stats', scope: { dac: ['Example DAC'] } },
    status: 200,
    response: { studyCount: 14, datasetCount: 37 },
  },
  {
    name: 'rejected: non-canonical identifier (consent would return it as DUOS-000123)',
    request: { mode: 'identifiers', section: 'open-access-datasets', identifiers: ['DUOS-123'] },
    status: 400,
    response: { message: 'Identifier "DUOS-123" is not canonical; use "DUOS-000123"' },
  },
  {
    name: 'rejected: field not allowed in this mode',
    request: { mode: 'stats', limit: 12 },
    status: 400,
    response: { message: 'Unrecognized field "limit" for mode "stats"' },
  },
]
