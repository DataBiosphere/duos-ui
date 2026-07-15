/**
 * Unit tests for clinicalTrialAsset — the Clinical Trials AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { clinicalTrialAsset } from 'src/components/data_library/assets/clinicalTrialAsset'
import { ClinicalTrialAsset, PaginationState, SortState } from 'src/types/library'
import {
  ClinicalTrialStudyAggregationBucket,
  ElasticsearchResponse,
  QueryClause,
} from 'src/types/elastic'
import { ClinicalTrialInterventionType, ClinicalTrialPhase, ClinicalTrialStatus } from 'src/types/model'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

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

const makeResponse = (
  buckets: ClinicalTrialStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('clinicalTrialAsset — label', () => {
  it('has singular "Clinical Trial" and plural "Clinical Trials"', () => {
    expect(clinicalTrialAsset.label.singular).toBe('Clinical Trial')
    expect(clinicalTrialAsset.label.plural).toBe('Clinical Trials')
  })
})

describe('clinicalTrialAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(clinicalTrialAsset.sortingMode).toBe('client')
  })
})

describe('clinicalTrialAsset — searchFields', () => {
  it('includes trial-specific fields', () => {
    expect(clinicalTrialAsset.searchFields).toContain('study.assets.clinicalTrials.title')
    expect(clinicalTrialAsset.searchFields).toContain('study.assets.clinicalTrials.sponsor')
    expect(clinicalTrialAsset.searchFields).toContain('study.assets.clinicalTrials.identifier')
    expect(clinicalTrialAsset.searchFields).toContain('study.assets.clinicalTrials.registry')
    expect(clinicalTrialAsset.searchFields).toContain('study.assets.clinicalTrials.tags')
  })

  it('includes study-level fields', () => {
    expect(clinicalTrialAsset.searchFields).toContain('study.studyName')
    expect(clinicalTrialAsset.searchFields).toContain('study.piName')
  })
})

describe('clinicalTrialAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = clinicalTrialAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = clinicalTrialAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = clinicalTrialAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('clinicalTrialAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = clinicalTrialAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
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
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
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
    expect(row.clinicalTrialId).toBe('NCT00000042')
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.title).toBe('Phase II Immunotherapy Study')
    expect(row.registry).toBe('ClinicalTrials.gov')
    expect(row.identifier).toBe('NCT00000042')
    expect(row.status).toBe(ClinicalTrialStatus.RECRUITING)
    expect(row.sponsor).toBe('NHGRI')
    expect(row.startDate).toBe('2024-01-01')
    expect(row.endDate).toBe('2026-12-31')
    expect(row.interventionType).toBe(ClinicalTrialInterventionType.BIOLOGICAL)
    expect(row.phase).toBe(ClinicalTrialPhase.PHASE2)
    expect(row.url).toBe('https://clinicaltrials.gov/study/NCT00000042')
    expect(row.tags).toEqual(['immunotherapy', 'cancer'])
  })

  it('falls back to composite key when clinicalTrialId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ title: 'No ID Trial' }]),
    ])
    const result = clinicalTrialAsset.transformResponse(response, pagination)
    const row = result.items[0] as ClinicalTrialAsset
    expect(row.clinicalTrialId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const trials = Array.from({ length: 30 }, (_, i) => ({
      clinicalTrialId: `ct${i}`,
      title: `Trial ${i}`,
    }))
    const response = makeResponse([makeBucket(1, trials)])

    const page0 = clinicalTrialAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as ClinicalTrialAsset).title).toBe('Trial 0')

    const page1 = clinicalTrialAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as ClinicalTrialAsset).title).toBe('Trial 10')

    const page2 = clinicalTrialAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as ClinicalTrialAsset).title).toBe('Trial 20')
  })

  it('reports total as the number of all trials across all studies (not just page)', () => {
    const trials = Array.from({ length: 30 }, (_, i) => ({ clinicalTrialId: `ct${i}` }))
    const response = makeResponse([makeBucket(1, trials)])
    const result = clinicalTrialAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty defaults for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = clinicalTrialAsset.transformResponse(response, pagination).items[0] as ClinicalTrialAsset
    expect(row.tags).toEqual([])
    expect(row.title).toBe('')
    expect(row.sponsor).toBe('')
    expect(row.status).toBe('')
    expect(row.phase).toBe('')
    expect(row.interventionType).toBe('')
    expect(row.identifier).toBe('')
    expect(row.registry).toBe('')
  })

  it('handles a study bucket with no clinical trials gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = clinicalTrialAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('returns only matching clinical trials when filtered within a shared study', () => {
    const response = makeResponse([
      makeBucket(1, [
        {
          clinicalTrialId: 'CT-RECRUITING',
          status: ClinicalTrialStatus.RECRUITING,
          phase: ClinicalTrialPhase.PHASE1,
        },
        {
          clinicalTrialId: 'CT-COMPLETED',
          status: ClinicalTrialStatus.COMPLETED,
          phase: ClinicalTrialPhase.PHASE2,
        },
      ]),
    ])

    const result = clinicalTrialAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      clinicalTrialStatus: [ClinicalTrialStatus.RECRUITING],
    })

    expect(result.items).toHaveLength(1)
    expect((result.items[0] as ClinicalTrialAsset).clinicalTrialId).toBe('CT-RECRUITING')
  })

  it('applies row-level date filtering to nested clinical trial rows', () => {
    const response = makeResponse([
      makeBucket(1, [
        {
          clinicalTrialId: 'CT-INSIDE',
          startDate: '2024-02-01',
          endDate: '2024-06-01',
        },
        {
          clinicalTrialId: 'CT-OUTSIDE',
          startDate: '2023-01-01',
          endDate: '2024-12-31',
        },
      ]),
    ])

    const result = clinicalTrialAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      clinicalTrialDates: {
        startDate: '2024-01-01',
        endDate: '2024-07-01',
      },
    })

    expect(result.items).toHaveLength(1)
    expect((result.items[0] as ClinicalTrialAsset).clinicalTrialId).toBe('CT-INSIDE')
  })
})

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
    expect(clinicalTrialAsset.getRowId(row)).toBe('NCT-abc-123')
  })
})

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
    expect(clinicalTrialAsset.isRowSelectable(row)).toBe(false)
  })
})

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
    expect(result.size).toBe(0)
  })
})

describe('clinicalTrialAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = clinicalTrialAsset.selectionToDatasetIds([], ['ct1', 'ct2'])
    expect(result).toEqual([])
  })
})

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
    expect(result).toEqual([])
  })
})

describe('clinicalTrialAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = clinicalTrialAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = clinicalTrialAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('title')
    expect(fields).toContain('studyName')
    expect(fields).toContain('status')
    expect(fields).toContain('phase')
    expect(fields).toContain('sponsor')
    expect(fields).toContain('identifier')
    expect(fields).toContain('interventionType')
  })

  it('produces the same result when called with or without props', () => {
    const a = clinicalTrialAsset.makeColumns()
    const b = clinicalTrialAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})
