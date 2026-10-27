/**
 * Data Showcase contract fixtures for DT-4272 (S1.1). All values are synthetic placeholders.
 *
 * The types are in `src/types/showcase.ts` (DT-4273, S1.2). S2.1 (DT-4274) finalizes the lookup
 * field names and `scope` vocabulary. The decisions behind them are recorded in consent
 * `docs/plans/data-showcase-contracts.md`.
 */
import type {
  AllResponseInput,
  DatasetSummaryInput,
  ErrorResponse,
  IdentifiersResponseInput,
  LookupRequestInput,
  RankingResponseInput,
  ShowcaseConfigInput,
  StatsResponse,
} from 'src/types/showcase'

type SectionConfigsInput = ShowcaseConfigInput['sections']

const OFF = { enabled: false } as const

const PLACEHOLDER = 'Placeholder copy; the product owner supplies the text.'

const HERO: Extract<SectionConfigsInput['hero'], { enabled: true }> = {
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
export const flagshipConfig: ShowcaseConfigInput = {
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
export const partnerConfig: ShowcaseConfigInput = {
  ...flagshipConfig,
  branding: { theme: 'blue' },
  sections: {
    ...flagshipConfig.sections,
    'masthead': { enabled: true, logos: [{ src: 'showcase/example-partner/logo.svg', alt: 'Example Partner', url: 'https://example.org' }] },
    'hero': { ...HERO, scope: { dac: ['Example DAC'] } },
    'latest-data-releases': { enabled: true, ranking: 'newest', scope: { dac: ['Example DAC'] }, limit: 12, pin: ['DUOS-000789'], exclude: ['DUOS-000111'] },
    'open-access-datasets': { enabled: true, items: ['DUOS-000123', 'DUOS-000456'] },
    'featured-tools': OFF,
    'featured-workspaces': OFF,
  },
}

// Lookup contract: POST /showcase/datasets (consent), proxied by the BFF as
// POST /public/showcase/datasets. The schemas are in `src/showcases/schema.ts`.

export type LookupExample
  = | { name: string, request: Extract<LookupRequestInput, { mode: 'identifiers' }>, status: 200, response: IdentifiersResponseInput }
    | { name: string, request: Extract<LookupRequestInput, { mode: 'ranking' }>, status: 200, response: RankingResponseInput }
    | { name: string, request: Extract<LookupRequestInput, { mode: 'all' }>, status: 200, response: AllResponseInput }
    | { name: string, request: Extract<LookupRequestInput, { mode: 'stats' }>, status: 200, response: StatsResponse }
    | { name: string, request: unknown, status: 400 | 413, response: ErrorResponse }

const OPEN_COHORT: DatasetSummaryInput = {
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
    name: 'rejected: non-canonical identifier (configs and requests must use DUOS-000123)',
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
