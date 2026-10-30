/**
 * In-memory stand-in for `lookupShowcaseDatasets` (DT-4281), for tests and E3 development only.
 * It lives under `test/` so a deployed build cannot import it. All rows are synthetic.
 *
 * Use it with `vi.mock('src/libs/ajax/ShowcaseCatalog')` and
 * `vi.mocked(lookupShowcaseDatasets).mockImplementation(createShowcaseCatalogMock())`.
 */
import type { lookupShowcaseDatasets } from 'src/libs/ajax/ShowcaseCatalog'
import type { DatasetSummaryInput, LookupRequestInput } from 'src/types/showcase'
import { lookupExamples } from './contracts'

export interface MockDataset {
  summary: DatasetSummaryInput
  /** Counted by `stats`; summaries carry no study. */
  studyId: string
}

const isSummary = (row: object): row is DatasetSummaryInput => 'title' in row

// The contract examples' summaries, so the mock and contracts.ts cannot drift.
const exampleSummaries = lookupExamples.flatMap(example =>
  example.status === 200 && 'datasets' in example.response ? (example.response.datasets as object[]).filter(isSummary) : [],
)

/** The dataset the ranking example excludes. */
const EXCLUDED: DatasetSummaryInput = { identifier: 'DUOS-000111', title: 'Example Excluded Cohort', accessManagement: 'controlled', dacName: 'Example DAC', consentCodes: ['GRU'], participantCount: 800, availableDate: '2026-10-10', accessUrl: null }

/** Default rows: each example summary once, plus EXCLUDED. */
export const MOCK_DATASETS: MockDataset[] = [
  ...new Map(exampleSummaries.map(summary => [summary.identifier, summary])).values(),
  EXCLUDED,
].map((summary, index) => ({ summary, studyId: `study-${Math.floor(index / 2)}` }))

type Lookup = typeof lookupShowcaseDatasets
type Scope = { dac?: string[] } | undefined

const inScope = (scope: Scope) => ({ summary }: MockDataset) =>
  !scope?.dac || (summary.dacName !== null && scope.dac.includes(summary.dacName))

// The open-access shelf shows open datasets only.
const inSection = (section: string) => ({ summary }: MockDataset) =>
  section !== 'open-access-datasets' || summary.accessManagement === 'open'

const byNewest = (a: MockDataset, b: MockDataset) =>
  (b.summary.availableDate ?? '').localeCompare(a.summary.availableDate ?? '') || a.summary.identifier.localeCompare(b.summary.identifier)

function identifiers(rows: MockDataset[], request: Extract<LookupRequestInput, { mode: 'identifiers' }>) {
  const eligible = new Map(rows.filter(inSection(request.section)).map(row => [row.summary.identifier, row.summary]))
  return {
    datasets: [...new Set(request.identifiers)].map(identifier =>
      eligible.get(identifier) ?? { identifier, status: 'unavailable' as const }),
  }
}

function ranking(rows: MockDataset[], request: Extract<LookupRequestInput, { mode: 'ranking' }>) {
  const excluded = new Set<string>(request.exclude ?? [])
  const eligible = rows.filter(inSection(request.section)).filter(inScope(request.scope))
    .filter(row => !excluded.has(row.summary.identifier))
  const pins = (request.pin ?? []).flatMap(id => eligible.filter(row => row.summary.identifier === id))
  const rest = eligible.filter(row => !pins.includes(row)).sort(byNewest)
  return { datasets: [...pins, ...rest].slice(0, request.limit ?? 12).map(row => row.summary) }
}

function all(rows: MockDataset[], request: Extract<LookupRequestInput, { mode: 'all' }>) {
  const sorted = [...rows].sort((a, b) => a.summary.identifier.localeCompare(b.summary.identifier))
  const start = request.cursor ? Number(request.cursor) : 0
  const end = start + (request.pageSize ?? 100)
  return { datasets: sorted.slice(start, end).map(row => row.summary), nextCursor: end < sorted.length ? String(end) : null }
}

function stats(rows: MockDataset[], request: Extract<LookupRequestInput, { mode: 'stats' }>) {
  const scoped = rows.filter(inScope(request.scope))
  return { studyCount: new Set(scoped.map(row => row.studyId)).size, datasetCount: scoped.length }
}

/** A lookup over `rows` with the client's signature. It skips the bounds checks that Consent makes. */
export function createShowcaseCatalogMock(rows: MockDataset[] = MOCK_DATASETS): Lookup {
  const resolve = (request: LookupRequestInput): unknown => {
    switch (request.mode) {
      case 'identifiers': return identifiers(rows, request)
      case 'ranking': return ranking(rows, request)
      case 'all': return all(rows, request)
      case 'stats': return stats(rows, request)
    }
  }
  return (async (request: LookupRequestInput) => structuredClone(resolve(request))) as Lookup
}
