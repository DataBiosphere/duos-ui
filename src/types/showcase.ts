/**
 * Data Showcase config types (DT-4273, S1.2).
 *
 * The zod schemas in `src/showcases/schema.ts` are the one definition. The types here derive from
 * them.
 * The decisions behind them are in consent `docs/plans/data-showcase-contracts.md`.
 *
 * This module holds no runtime zod import, so code that only needs the constants or the types does
 * not add zod to the bundle.
 *
 * Authored configs use the `...Input` types. Identifiers and dates in an `...Input` type are plain
 * template strings; the schema checks their canonical form and brands them, so only parsed output
 * carries the `DuosIdentifier` and `DateString` types.
 */
import type * as z from 'zod'
import type {
  AllResponseSchema,
  DatasetSummarySchema,
  DateStringSchema,
  DuosIdentifierSchema,
  ErrorResponseSchema,
  IdentifiersResponseSchema,
  LookupRequestSchema,
  RankingResponseSchema,
  RegistryEntrySchema,
  ShowcaseConfigSchema,
  ShowcaseRegistrySchema,
  StatsResponseSchema,
  UnavailableResultSchema,
} from 'src/showcases/schema'

export const SCHEMA_VERSION = 1

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
export const MVP_SECTION_KEYS = [
  'masthead',
  'hero',
  'latest-data-releases',
  'open-access-datasets',
  'featured-tools',
  'featured-workspaces',
] as const satisfies readonly SectionKey[]

/** Sections whose items the hero `tools` stat counts. Workspaces are not tools. */
export const TOOL_SECTION_KEYS = ['featured-tools', 'new-workflow-tools', 'notebooks', 'ai-models'] as const satisfies readonly SectionKey[]

/** Rankings each computed dataset section accepts. */
export const SECTION_RANKINGS = {
  'latest-data-releases': ['newest'],
  'most-requested-datasets': ['most-requested'],
  'largest-cohorts': ['largest-cohort'],
  'open-access-datasets': ['newest'],
  'instant-approval': ['instant-eligible'],
  'datasets-moving-to-archive': ['archive-soonest'],
} as const satisfies Partial<Record<SectionKey, readonly string[]>>

export type DatasetSectionKey = keyof typeof SECTION_RANKINGS
export type Ranking = (typeof SECTION_RANKINGS)[DatasetSectionKey][number]

export const DATASET_SECTION_KEYS = Object.keys(SECTION_RANKINGS) as DatasetSectionKey[]

/** The only dataset section that may list its datasets by hand. Hand-curated rankings go stale. */
export const EDITORIAL_SECTION_KEY = 'open-access-datasets' satisfies DatasetSectionKey

/** Canonical identifier: `DUOS-` plus the alias zero-padded to six digits, never more padding.
 * Configs use it, and consent echoes it unchanged. */
export const DUOS_IDENTIFIER_PATTERN = /^DUOS-(\d{6}|[1-9]\d{6,})$/

/** `YYYY-MM-DD` calendar date in UTC. Date ranges include both `startDate` and `endDate`. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** A showcase key: lowercase words joined by single hyphens. `data` and `flagship` are reserved. */
export const SHOWCASE_KEY_PATTERN = /^(?!(?:data|flagship)$)[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A dataset whose `availableDate` is at most this many days before today (UTC) shows "New in DUOS".
 * Workflow items use the same window with their `addedDate`. */
export const NEW_BADGE_DAYS = 30

/** How an authored config writes an identifier; the schema checks the canonical form. */
export type DuosIdentifierInput = `DUOS-${number}`
/** How an authored config writes a date; the schema checks the format and the calendar. */
export type DateStringInput = `${number}-${number}-${number}`

export type DuosIdentifier = z.output<typeof DuosIdentifierSchema>
export type DateString = z.output<typeof DateStringSchema>

export type ShowcaseConfigInput = z.input<typeof ShowcaseConfigSchema>
export type ShowcaseConfig = z.output<typeof ShowcaseConfigSchema>
export type SectionConfigs = ShowcaseConfig['sections']

export type LookupRequestInput = z.input<typeof LookupRequestSchema>
export type LookupRequest = z.output<typeof LookupRequestSchema>
export type DatasetSummary = z.output<typeof DatasetSummarySchema>
export type UnavailableResult = z.output<typeof UnavailableResultSchema>
export type IdentifiersResponse = z.output<typeof IdentifiersResponseSchema>
export type RankingResponse = z.output<typeof RankingResponseSchema>
export type AllResponse = z.output<typeof AllResponseSchema>
export type DatasetSummaryInput = z.input<typeof DatasetSummarySchema>
export type IdentifiersResponseInput = z.input<typeof IdentifiersResponseSchema>
export type RankingResponseInput = z.input<typeof RankingResponseSchema>
export type AllResponseInput = z.input<typeof AllResponseSchema>
export type StatsResponse = z.output<typeof StatsResponseSchema>
export type ErrorResponse = z.output<typeof ErrorResponseSchema>

export type RegistryEntry = z.output<typeof RegistryEntrySchema>
export type ShowcaseRegistry = z.output<typeof ShowcaseRegistrySchema>
