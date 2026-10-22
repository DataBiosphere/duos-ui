/**
 * The one definition of the Data Showcase config, the showcase registry and the public catalog
 * lookup (DT-4273, S1.2). `src/types/showcase.ts` derives the TypeScript types from these schemas,
 * and `showcase.schema.json` is the JSON Schema export of `ShowcaseConfigSchema`.
 *
 * The schemas check shape. The CI guard adds the rules that a JSON Schema can't express (key order,
 * implemented types, the full URL policy, retired keys, limits and the asset budget). Calendar-date
 * checks are zod refinements, which the JSON Schema export leaves out.
 */
import * as z from 'zod'
import {
  DATE_PATTERN,
  type DatasetSectionKey,
  type DateStringInput,
  DUOS_IDENTIFIER_PATTERN,
  type DuosIdentifierInput,
  EDITORIAL_SECTION_KEY,
  SCHEMA_VERSION,
  SECTION_KEYS,
  SECTION_RANKINGS,
  SHOWCASE_KEY_PATTERN,
} from 'src/types/showcase'

const isCalendarDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

// The casts keep the authored (input) type a template string while the parsed output is branded.
export const DuosIdentifierSchema = z.string().regex(DUOS_IDENTIFIER_PATTERN).meta({ id: 'ShowcaseDuosIdentifier' }).brand<'DuosIdentifier'>() as unknown as z.ZodType<
  string & z.$brand<'DuosIdentifier'>,
  DuosIdentifierInput
>

export const DateStringSchema = z.string().regex(DATE_PATTERN).refine(isCalendarDate, 'Not a calendar date').meta({ id: 'ShowcaseDateString' }).brand<'DateString'>() as unknown as z.ZodType<
  string & z.$brand<'DateString'>,
  DateStringInput
>

/** `https://` URL, a same-origin path beginning with `/`, or `#<section key>` for a same-page
 * section. This is the shape only: the CI guard and the renderer also reject `//host`, backslash
 * variants, control characters, credentials and malformed encodings. */
export const SafeUrlSchema = z.union([
  z.templateLiteral(['https://', z.string()]),
  z.templateLiteral(['/', z.string()]),
  z.templateLiteral(['#', z.enum(SECTION_KEYS)]),
]).meta({ id: 'ShowcaseSafeUrl' })

const LinkSchema = z.strictObject({ label: z.string(), url: SafeUrlSchema }).meta({ id: 'ShowcaseLink' })

/** `alt` is required. A logo needs non-empty alt text; other images may use `''` when decorative. */
const ImageSchema = z.strictObject({ src: z.string(), alt: z.string() }).meta({ id: 'ShowcaseImage' })

/** Provisional until S2.1 agrees the scope vocabulary. */
export const ScopeSchema = z.strictObject({ dac: z.array(z.string()).optional() }).meta({ id: 'ShowcaseScope' })

/** Fields every section type accepts. */
const COMMON_FIELDS = {
  title: z.string().optional(),
  subtitle: z.string().optional(),
  navLabel: z.string().optional(),
  cta: LinkSchema.optional(),
  seeAllUrl: SafeUrlSchema.optional(),
}

const enabledSection = <S extends z.ZodRawShape>(shape: S) =>
  z.strictObject({ enabled: z.literal(true), ...COMMON_FIELDS, ...shape })

/** A disabled section may keep any of its content. */
const disabledSection = <S extends z.ZodRawShape>(shape: S) =>
  z.strictObject({ ...COMMON_FIELDS, ...shape }).partial().extend({ enabled: z.literal(false) })

const section = <S extends z.ZodRawShape>(shape: S) => z.union([enabledSection(shape), disabledSection(shape)])

/** A section with two content forms. A disabled section may keep the content of either, not both. */
const sectionVariants = <A extends z.ZodRawShape, B extends z.ZodRawShape>(a: A, b: B) =>
  z.union([enabledSection(a), enabledSection(b), disabledSection(a), disabledSection(b)])

/** The fields of a computed dataset shelf. The lookup's `ranking` mode accepts the same fields. */
const rankingFields = <K extends DatasetSectionKey>(key: K) => ({
  ranking: z.enum(SECTION_RANKINGS[key]),
  scope: ScopeSchema.optional(),
  limit: z.number().int().positive().optional(),
  pin: z.array(DuosIdentifierSchema).optional(),
  exclude: z.array(DuosIdentifierSchema).optional(),
})

/** Computed-only dataset sections: hand-curated rankings go stale (delivery plan section 3). */
const computedShelf = <K extends DatasetSectionKey>(key: K) => section(rankingFields(key))

/** The editorial section lists datasets by hand (`items`) or is computed (`ranking`), never both. */
const editorialShelf = sectionVariants(
  { items: z.array(DuosIdentifierSchema), ranking: z.never().optional() },
  { ...rankingFields(EDITORIAL_SECTION_KEY), items: z.never().optional() },
)

/** Hero stats are computed live; a stat whose value is 0 is hidden. `studies` and `datasets` come
 * from the lookup `stats` mode with the hero's `scope` (none: the whole public catalog). `tools`
 * counts the items in the enabled `TOOL_SECTION_KEYS` sections. */
const HeroStatSchema = z.enum(['studies', 'datasets', 'tools'])

const AnnouncementSchema = z.strictObject({
  id: z.string(),
  text: z.string(),
  url: SafeUrlSchema,
  startDate: DateStringSchema,
  endDate: DateStringSchema,
})

/** Story 29 item form for tools, workflows, notebooks, models and workspaces. */
const RESOURCE_ITEM_FIELDS = {
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  thumbnail: ImageSchema.optional(),
  launchUrl: SafeUrlSchema,
  docsUrl: SafeUrlSchema.optional(),
}

const resourceShelf = <S extends z.ZodRawShape>(extra: S = {} as S) =>
  section({ items: z.array(z.strictObject({ ...RESOURCE_ITEM_FIELDS, ...extra })) })

const PublicationItemSchema = z.strictObject({
  id: z.string(),
  citation: z.string(),
  summary: z.string(),
  url: SafeUrlSchema,
  year: z.number().int(),
})

const GroupingItemSchema = z.strictObject({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  icon: ImageSchema.optional(),
  destinationUrl: SafeUrlSchema,
})

/** Program panels: `description` is Markdown rendered without raw HTML. */
const programPanel = () => section({ description: z.string(), ctas: z.array(LinkSchema) })

const SectionsSchema = z.strictObject({
  'masthead': section({ logos: z.array(ImageSchema.extend({ url: SafeUrlSchema.optional() })) }),
  'hero': section({
    intro: z.string(),
    stats: z.array(HeroStatSchema),
    scope: ScopeSchema.optional(),
    announcements: z.array(AnnouncementSchema),
    onboarding: z.array(LinkSchema),
    primaryCtas: z.array(LinkSchema),
  }),
  'latest-data-releases': computedShelf('latest-data-releases'),
  'most-requested-datasets': computedShelf('most-requested-datasets'),
  'largest-cohorts': computedShelf('largest-cohorts'),
  'open-access-datasets': editorialShelf,
  'instant-approval': computedShelf('instant-approval'),
  /** `full-catalog` is flagship-only (current DT-3904 Story 13). */
  'datasets-at-a-glance': section({
    charts: z.array(z.enum(['disease-area', 'data-type', 'access-type'])),
    scope: z.enum(['curated', 'full-catalog']),
  }),
  'datasets-moving-to-archive': computedShelf('datasets-moving-to-archive'),
  'featured-tools': resourceShelf({ featured: z.boolean().optional() }),
  /** `addedDate` drives the "New" badge (original Story 15). */
  'new-workflow-tools': resourceShelf({ addedDate: DateStringSchema.optional() }),
  'notebooks': resourceShelf(),
  'ai-models': resourceShelf(),
  'featured-workspaces': resourceShelf(),
  'latest-published-science': section({ items: z.array(PublicationItemSchema), selfReportPrompt: z.boolean() }),
  'research-area': section({ items: z.array(GroupingItemSchema) }),
  'research-initiative': section({ items: z.array(GroupingItemSchema) }),
  /** Original Story 21: an embed, or a periodically refreshed snapshot of through.bio data, shown as
   * not live, with attribution. */
  'program-impact': sectionVariants(
    { mode: z.literal('embed'), embedUrl: SafeUrlSchema, attribution: z.string() },
    {
      mode: z.literal('snapshot'),
      snapshotDate: DateStringSchema,
      sourceUrl: SafeUrlSchema,
      attribution: z.string(),
      statBanner: z.array(z.strictObject({ label: z.string(), value: z.string() })),
    },
  ),
  'community-conference': section({
    startDate: DateStringSchema,
    endDate: DateStringSchema,
    /** IANA time zone, e.g. `America/New_York`. */
    timezone: z.string(),
    location: z.string(),
    description: z.string(),
    registration: z.union([
      z.strictObject({ state: z.literal('open'), url: SafeUrlSchema }),
      z.strictObject({ state: z.literal('alert-signup') }),
    ]),
  }),
  'where-else': programPanel(),
  'training-workshops': programPanel(),
  'scholars-program': programPanel(),
  'tech-policy-interns': programPanel(),
})

export const ShowcaseConfigSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  /** Theme presets are set in S1.3. Logo alt text is on the masthead logos. */
  branding: z.strictObject({ theme: z.string() }),
  sections: SectionsSchema,
})

/** One showcase in `registry.json`. The route derives from the key (see `showcaseRoute`). */
export const RegistryEntrySchema = z.strictObject({
  key: z.string().regex(SHOWCASE_KEY_PATTERN),
  title: z.string().min(1),
  /** `hidden` keeps the route off; it is not a privacy control. */
  status: z.enum(['live', 'hidden']),
  flagship: z.boolean(),
  order: z.number().int().nonnegative(),
})

export const ShowcaseRegistrySchema = z.strictObject({
  entries: z.array(RegistryEntrySchema),
  /** Retired keys are permanent tombstones: never removed and never reused. */
  retiredKeys: z.array(z.string().regex(SHOWCASE_KEY_PATTERN)),
})

// Lookup contract: POST /showcase/datasets (consent), proxied by the BFF as
// POST /public/showcase/datasets. Field names are provisional until S2.1.

/** A provider link in a lookup response. Unlike an authored `SafeUrl`, consent returns any absolute
 * `http` or `https` URL, with the scheme in any case, and the value is kept unchanged. */
const ProviderUrlSchema = z.url({ protocol: /^https?$/i })

const rankingRequest = <K extends DatasetSectionKey>(key: K) =>
  z.strictObject({ mode: z.literal('ranking'), section: z.literal(key), ...rankingFields(key) })

export const LookupRequestSchema = z.union([
  z.strictObject({
    mode: z.literal('identifiers'),
    section: z.literal(EDITORIAL_SECTION_KEY),
    identifiers: z.array(DuosIdentifierSchema),
  }),
  rankingRequest('latest-data-releases'),
  rankingRequest('most-requested-datasets'),
  rankingRequest('largest-cohorts'),
  rankingRequest('open-access-datasets'),
  rankingRequest('instant-approval'),
  rankingRequest('datasets-moving-to-archive'),
  z.strictObject({ mode: z.literal('all'), pageSize: z.number().int().positive().optional(), cursor: z.string().optional() }),
  z.strictObject({ mode: z.literal('stats'), scope: ScopeSchema.optional() }),
])

export const DatasetSummarySchema = z.object({
  identifier: DuosIdentifierSchema,
  title: z.string(),
  /** `null` when the dataset has no recognized access management. */
  accessManagement: z.enum(['open', 'controlled', 'external']).nullable(),
  dacName: z.string().nullable(),
  /** Human-readable consent codes, e.g. `GRU`, `HMB`. */
  consentCodes: z.array(z.string()),
  participantCount: z.number().int().nullable(),
  /** "New in DUOS" date: `dac_approval_date` (controlled) or `create_date` (open/external). */
  availableDate: DateStringSchema.nullable(),
  /** Approved provider link for open and external datasets; `null` for controlled datasets, which
   * use the DUOS request handoff. */
  accessUrl: ProviderUrlSchema.nullable(),
})

export const UnavailableResultSchema = z.object({ identifier: DuosIdentifierSchema, status: z.literal('unavailable') })

export const IdentifiersResponseSchema = z.object({ datasets: z.array(z.union([DatasetSummarySchema, UnavailableResultSchema])) })

export const RankingResponseSchema = z.object({ datasets: z.array(DatasetSummarySchema) })

export const AllResponseSchema = z.object({ datasets: z.array(DatasetSummarySchema), nextCursor: z.string().nullable() })

/** Requestable tier (S2.1): the same rows a shelf can show. */
export const StatsResponseSchema = z.object({ studyCount: z.number().int(), datasetCount: z.number().int() })

export const ErrorResponseSchema = z.object({ message: z.string() })
