/**
 * Unit tests for clinicalTrialAsset — the Clinical Trials AssetDefinition.
 *
 * These tests are purely logic-level (no DOM mounting) so they run quickly
 * in the Cypress component runner via plain `describe` / `it` blocks.
 */
import { clinicalTrialAsset } from 'src/components/data_library/assets/clinicalTrialAsset'
import { ClinicalTrialAsset, PaginationState, SortState } from 'src/types/library'
import {
  ClinicalTrialStudyAggregationBucket,
  ElasticsearchResponse,
  QueryClause,
} from 'src/types/elastic'
import { ClinicalTrialInterventionType, ClinicalTrialPhase, ClinicalTrialStatus } from 'src/types/model'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination: PaginationState = { page: 0, pageSize: 25 }

/** Build a minimal ClinicalTrialStudyAggregationBucket */
const makeBucket = (
  studyId: number,
  trials: Array<{
    clinicalTrialId?: string
    title?: string
    registry?: string
    identifier?: string
    status?: ClinicalTrialStatus
    sponsor?: string
    startDate?: string
    endDate?: string
    interventionType?: ClinicalTrialInterventionType
    description?: string
    phase?: ClinicalTrialPhase
    url?: string
    tags?: string[]
  }> = [],
  studyName = 'Test Study',
): ClinicalTrialStudyAggregationBucket => ({
  key: studyId,
  doc_count: trials.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                clinicalTrials: trials.map(t => ({
                  clinicalTrialId: t.clinicalTrialId,
                  title: t.title,
                  registry: t.registry,
                  identifier: t.identifier,
                  status: t.status,
                  sponsor: t.sponsor,
                  startDate: t.startDate,
                  endDate: t.endDate,
                  interventionType: t.interventionType,
                  description: t.description,
                  phase: t.phase,
                  url: t.url,
                  tags: t.tags,
                })),
              },
            },
          },
        },
      ],
    },
  },
})

/** Wrap buckets in a full ElasticsearchResponse */
const makeResponse = (
  buckets: ClinicalTrialStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — label', () => {
  it('has singular "Clinical Trial" and plural "Clinical Trials"', () => {
    expect(clinicalTrialAsset.label.singular).to.equal('Clinical Trial')
    expect(clinicalTrialAsset.label.plural).to.equal('Clinical Trials')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(clinicalTrialAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — searchFields', () => {
  it('includes trial-specific fields', () => {
    expect(clinicalTrialAsset.searchFields).to.include('study.assets.clinicalTrials.title')
    expect(clinicalTrialAsset.searchFields).to.include('study.assets.clinicalTrials.sponsor')
    expect(clinicalTrialAsset.searchFields).to.include('study.assets.clinicalTrials.identifier')
    expect(clinicalTrialAsset.searchFields).to.include('study.assets.clinicalTrials.registry')
    expect(clinicalTrialAsset.searchFields).to.include('study.assets.clinicalTrials.tags')
  })

  it('includes study-level fields', () => {
    expect(clinicalTrialAsset.searchFields).to.include('study.studyName')
    expect(clinicalTrialAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = clinicalTrialAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = clinicalTrialAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = clinicalTrialAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('flattens trials from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [
        { clinicalTrialId: 'ct1', title: 'Trial Alpha' },
        { clinicalTrialId: 'ct2', title: 'Trial Beta' },
      ]),
      makeBucket(2, [{ clinicalTrialId: 'ct3', title: 'Trial Gamma' }]),
    ])
    const result = clinicalTrialAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
  })

  it('maps fields correctly from bucket to ClinicalTrialAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        clinicalTrialId: 'NCT00000042',
        title: 'Phase II Immunotherapy Study',
        registry: 'ClinicalTrials.gov',
        identifier: 'NCT00000042',
        status: ClinicalTrialStatus.RECRUITING,
        sponsor: 'NHGRI',
        startDate: '2024-01-01',
        endDate: '2026-12-31',
        interventionType: ClinicalTrialInterventionType.BIOLOGICAL,
        description: 'A phase II study',
        phase: ClinicalTrialPhase.PHASE2,
        url: 'https://clinicaltrials.gov/study/NCT00000042',
        tags: ['immunotherapy', 'cancer'],
      }], 'NHGRI Study'),
    ])
    const result = clinicalTrialAsset.transformResponse(response, pagination)
    const row = result.items[0] as ClinicalTrialAsset
    expect(row.clinicalTrialId).to.equal('NCT00000042')
    expect(row.studyId).to.equal(42)
    expect(row.studyName).to.equal('NHGRI Study')
    expect(row.title).to.equal('Phase II Immunotherapy Study')
    expect(row.registry).to.equal('ClinicalTrials.gov')
    expect(row.identifier).to.equal('NCT00000042')
    expect(row.status).to.equal(ClinicalTrialStatus.RECRUITING)
    expect(row.sponsor).to.equal('NHGRI')
    expect(row.startDate).to.equal('2024-01-01')
    expect(row.endDate).to.equal('2026-12-31')
    expect(row.interventionType).to.equal(ClinicalTrialInterventionType.BIOLOGICAL)
    expect(row.phase).to.equal(ClinicalTrialPhase.PHASE2)
    expect(row.url).to.equal('https://clinicaltrials.gov/study/NCT00000042')
    expect(row.tags).to.deep.equal(['immunotherapy', 'cancer'])
  })

  it('falls back to composite key when clinicalTrialId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ title: 'No ID Trial' }]),
    ])
    const result = clinicalTrialAsset.transformResponse(response, pagination)
    const row = result.items[0] as ClinicalTrialAsset
    expect(row.clinicalTrialId).to.equal('99-0')
  })

  it('applies client-side pagination', () => {
    const trials = Array.from({ length: 30 }, (_, i) => ({
      clinicalTrialId: `ct${i}`,
      title: `Trial ${i}`,
    }))
    const response = makeResponse([makeBucket(1, trials)])

    const page0 = clinicalTrialAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).to.have.length(10)
    expect((page0.items[0] as ClinicalTrialAsset).title).to.equal('Trial 0')

    const page1 = clinicalTrialAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect((page1.items[0] as ClinicalTrialAsset).title).to.equal('Trial 10')

    const page2 = clinicalTrialAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as ClinicalTrialAsset).title).to.equal('Trial 20')
  })

  it('reports total as the number of all trials across all studies (not just page)', () => {
    const trials = Array.from({ length: 30 }, (_, i) => ({ clinicalTrialId: `ct${i}` }))
    const response = makeResponse([makeBucket(1, trials)])
    const result = clinicalTrialAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).to.equal(30)
  })

  it('returns empty defaults for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = clinicalTrialAsset.transformResponse(response, pagination).items[0] as ClinicalTrialAsset
    expect(row.tags).to.deep.equal([])
    expect(row.title).to.equal('')
    expect(row.sponsor).to.equal('')
    expect(row.status).to.equal('')
    expect(row.phase).to.equal('')
    expect(row.interventionType).to.equal('')
    expect(row.identifier).to.equal('')
    expect(row.registry).to.equal('')
  })

  it('handles a study bucket with no clinical trials gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = clinicalTrialAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — getRowId', () => {
  it('returns the clinicalTrialId of the row', () => {
    const row: ClinicalTrialAsset = {
      clinicalTrialId: 'NCT-abc-123',
      studyId: 1,
      studyName: '',
      title: '',
      registry: '',
      identifier: '',
      status: '' as ClinicalTrialStatus,
      sponsor: '',
      startDate: '',
      interventionType: '' as ClinicalTrialInterventionType,
      description: '',
      phase: '' as ClinicalTrialPhase,
      url: '',
    }
    expect(clinicalTrialAsset.getRowId(row)).to.equal('NCT-abc-123')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — isRowSelectable', () => {
  it('always returns false — clinical trials do not participate in access requests', () => {
    const row: ClinicalTrialAsset = {
      clinicalTrialId: 'ct1',
      studyId: 1,
      studyName: '',
      title: '',
      registry: '',
      identifier: '',
      status: '' as ClinicalTrialStatus,
      sponsor: '',
      startDate: '',
      interventionType: '' as ClinicalTrialInterventionType,
      description: '',
      phase: '' as ClinicalTrialPhase,
      url: '',
    }
    expect(clinicalTrialAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: ClinicalTrialAsset = {
      clinicalTrialId: 'ct1',
      studyId: 1,
      studyName: '',
      title: '',
      registry: '',
      identifier: '',
      status: '' as ClinicalTrialStatus,
      sponsor: '',
      startDate: '',
      interventionType: '' as ClinicalTrialInterventionType,
      description: '',
      phase: '' as ClinicalTrialPhase,
      url: '',
    }
    const result = clinicalTrialAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// selectionToDatasetIds
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = clinicalTrialAsset.selectionToDatasetIds([], ['ct1', 'ct2'])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// getStudyIdsForSelection
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: ClinicalTrialAsset = {
      clinicalTrialId: 'ct1',
      studyId: 42,
      studyName: '',
      title: '',
      registry: '',
      identifier: '',
      status: '' as ClinicalTrialStatus,
      sponsor: '',
      startDate: '',
      interventionType: '' as ClinicalTrialInterventionType,
      description: '',
      phase: '' as ClinicalTrialPhase,
      url: '',
    }
    const result = clinicalTrialAsset.getStudyIdsForSelection([row], [1])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('clinicalTrialAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = clinicalTrialAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes required field names', () => {
    const cols = clinicalTrialAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).to.include('title')
    expect(fields).to.include('studyName')
    expect(fields).to.include('status')
    expect(fields).to.include('phase')
    expect(fields).to.include('sponsor')
    expect(fields).to.include('identifier')
    expect(fields).to.include('interventionType')
  })

  it('produces the same result when called with or without props', () => {
    const a = clinicalTrialAsset.makeColumns()
    const b = clinicalTrialAsset.makeColumns({})
    expect(a.map(c => c.field)).to.deep.equal(b.map(c => c.field))
  })
})
