import { describe, it, expect } from 'vitest'
import { FundingResourceAsset as FundingResourceRow, PaginationState, SortState } from 'src/types/library'
import { ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { fundingResourceAsset } from 'src/components/data_library/assets/fundingResourceAsset'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: string,
  funding: Array<{
    fundingId?: string
    funderName?: string
    funderProgram?: string
    grantNumber?: string
    projectTitle?: string
    startDate?: string
    endDate?: string
    url?: string
    tags?: string[]
  }> = [],
  studyName = 'Test Study',
) => ({
  key: studyId,
  doc_count: funding.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                funding: funding.map(f => ({
                  fundingId: f.fundingId,
                  funderName: f.funderName,
                  funderProgram: f.funderProgram,
                  grantNumber: f.grantNumber,
                  projectTitle: f.projectTitle,
                  startDate: f.startDate,
                  endDate: f.endDate,
                  url: f.url,
                  tags: f.tags,
                })),
              },
            },
          },
        },
      ],
    },
  },
})

const makeResponse = (buckets: ReturnType<typeof makeBucket>[]): ElasticsearchResponse =>
  ({
    items: [],
    total: 0,
    // oxlint-disable-next-line @typescript-eslint/no-explicit-any
    aggregations: { studies: { buckets } as any },
  }) as ElasticsearchResponse

describe('fundingResourceAsset — label', () => {
  it('has singular "FundingResource" and plural "FundingResources"', () => {
    expect(fundingResourceAsset.label.singular).toBe('FundingResource')
    expect(fundingResourceAsset.label.plural).toBe('FundingResources')
  })
})

describe('fundingResourceAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(fundingResourceAsset.sortingMode).toBe('client')
  })
})

describe('fundingResourceAsset — searchFields', () => {
  it('includes funding-specific fields', () => {
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.fundingId')
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.funderName')
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.funderProgram')
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.grantNumber')
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.projectTitle')
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.url')
    expect(fundingResourceAsset.searchFields).toContain('study.assets.funding.tags')
  })

  it('includes study-level fields', () => {
    expect(fundingResourceAsset.searchFields).toContain('study.studyName')
    expect(fundingResourceAsset.searchFields).toContain('study.description')
    expect(fundingResourceAsset.searchFields).toContain('study.piName')
  })
})

describe('fundingResourceAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study.assets.funding' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as { terms: { field: string, size: number } }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe(
      'study.assets.funding',
    )
  })

  it('omits filter when filterQuery is empty', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = { term: { 'accessManagement.keyword': 'controlled' } }
    const q = fundingResourceAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'fundingId', order: 'asc' }
    const largePagination: PaginationState = { page: 5, pageSize: 100 }
    const q = fundingResourceAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('fundingResourceAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = fundingResourceAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens funding resources from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket('1', [
        { fundingId: 'FR-001', funderName: 'NIH' },
        { fundingId: 'FR-002', funderName: 'NSF' },
      ]),
      makeBucket('2', [{ fundingId: 'FR-003', funderName: 'DoD' }]),
    ])
    const result = fundingResourceAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to FundingResourceAsset', () => {
    const response = makeResponse([
      makeBucket(
        '42',
        [
          {
            fundingId: 'FR-12345',
            funderName: 'NIH',
            funderProgram: 'R01',
            grantNumber: 'R01-ABC',
            projectTitle: 'Project Atlas',
            startDate: '2023-01-15',
            endDate: '2024-01-14',
            url: 'https://example.org/grant',
            tags: ['genomics', 'rare-disease'],
          },
        ],
        'NHGRI Study',
      ),
    ])
    const result = fundingResourceAsset.transformResponse(response, pagination)
    const row = result.items[0] as FundingResourceRow
    expect(row.fundingId).toBe('FR-12345')
    expect(row.studyId).toBe('42')
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.funderName).toBe('NIH')
    expect(row.funderProgram).toBe('R01')
    expect(row.grantNumber).toBe('R01-ABC')
    expect(row.projectTitle).toBe('Project Atlas')
    expect(row.startDate).toBe('2023-01-15')
    expect(row.endDate).toBe('2024-01-14')
    expect(row.url).toBe('https://example.org/grant')
    expect(row.tags).toEqual(['genomics', 'rare-disease'])
  })

  it('falls back to composite key when fundingId is absent', () => {
    const response = makeResponse([makeBucket('99', [{ funderName: 'NSF' }])])
    const result = fundingResourceAsset.transformResponse(response, pagination)
    const row = result.items[0] as FundingResourceRow
    expect(row.fundingId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const funding = Array.from({ length: 30 }, (_, i) => ({
      fundingId: `FR-${String(i).padStart(3, '0')}`,
      funderName: `Funder-${i}`,
    }))
    const response = makeResponse([makeBucket('1', funding)])

    const page0 = fundingResourceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as FundingResourceRow).fundingId).toBe('FR-000')

    const page1 = fundingResourceAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as FundingResourceRow).fundingId).toBe('FR-010')

    const page2 = fundingResourceAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as FundingResourceRow).fundingId).toBe('FR-020')
  })

  it('reports total as all funding resources across all studies', () => {
    const funding = Array.from({ length: 30 }, (_, i) => ({ fundingId: `FR-${i}` }))
    const response = makeResponse([makeBucket('1', funding)])
    const result = fundingResourceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty/default values for missing fields', () => {
    const response = makeResponse([makeBucket('1', [{}])])
    const row = fundingResourceAsset.transformResponse(response, pagination).items[0] as FundingResourceRow
    expect(row.fundingId).toBe('1-0')
    expect(row.studyName).toBe('Test Study')
    expect(row.funderName).toBe('')
    expect(row.funderProgram).toBe('')
    expect(row.grantNumber).toBe('')
    expect(row.projectTitle).toBe('')
    expect(row.startDate).toBe('')
    expect(row.endDate).toBe('')
    expect(row.url).toBe('')
    expect(row.tags).toEqual([])
  })

  it('handles a study bucket with no funding resources gracefully', () => {
    const response = makeResponse([makeBucket('1', [])])
    const result = fundingResourceAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  // The ES clause for fundingDate only decides which studies are aggregated;
  // every funding resource of a qualifying study comes back, so
  // transformResponse must re-check each row or the grid and count badge
  // include out-of-range rows.
  it('returns only funding resources within the fundingDate range', () => {
    const response = makeResponse([
      makeBucket('1', [
        { fundingId: 'f-too-early', startDate: '2018-01-01', endDate: '2019-01-01' },
        { fundingId: 'f-in-range', startDate: '2021-01-01', endDate: '2022-06-30' },
        { fundingId: 'f-too-late', startDate: '2021-01-01', endDate: '2026-01-01' },
      ]),
    ])

    const result = fundingResourceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      fundingDate: { startDate: '2020-01-01', endDate: '2023-12-31' },
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as FundingResourceRow).fundingId).toBe('f-in-range')
  })

  // An inverted range builds no ES clause, so it must not narrow rows here
  // either — otherwise the grid empties while the panel flags the range.
  it('ignores an inverted fundingDate range instead of filtering everything out', () => {
    const response = makeResponse([
      makeBucket('1', [
        { fundingId: 'f-1', startDate: '2018-01-01', endDate: '2019-01-01' },
        { fundingId: 'f-2', startDate: '2021-01-01', endDate: '2022-06-30' },
      ]),
    ])

    const result = fundingResourceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      fundingDate: { startDate: '2024-01-01', endDate: '2023-01-01' },
    })

    expect(result.total).toBe(2)
  })
})

describe('fundingResourceAsset — getRowId', () => {
  it('returns the fundingId of the row', () => {
    const row: FundingResourceRow = {
      fundingId: 'FR-xyz-789',
      studyId: 1,
      studyName: '',
      funderName: '',
      funderProgram: '',
      grantNumber: '',
      projectTitle: '',
      startDate: '',
      endDate: '',
      url: '',
      tags: [],
    }
    expect(fundingResourceAsset.getRowId(row)).toBe('FR-xyz-789')
  })
})

describe('fundingResourceAsset — isRowSelectable', () => {
  it('always returns false — funding resources do not participate in access requests', () => {
    const row: FundingResourceRow = {
      fundingId: 'FR-001',
      studyId: 1,
      studyName: 'Test',
      funderName: 'NIH',
      funderProgram: 'R01',
      grantNumber: 'R01-XYZ',
      projectTitle: 'Project',
      startDate: '',
      endDate: '',
      url: '',
      tags: [],
    }
    expect(fundingResourceAsset.isRowSelectable(row)).toBe(false)
  })
})

describe('fundingResourceAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: FundingResourceRow = {
      fundingId: 'FR-001',
      studyId: 1,
      studyName: 'Test',
      funderName: '',
      funderProgram: '',
      grantNumber: '',
      projectTitle: '',
      startDate: '',
      endDate: '',
      url: '',
      tags: [],
    }
    const result = fundingResourceAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).toBe(0)
  })
})

describe('fundingResourceAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = fundingResourceAsset.selectionToDatasetIds([], ['FR-001', 'FR-002'])
    expect(result).toEqual([])
  })
})

describe('fundingResourceAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: FundingResourceRow = {
      fundingId: 'FR-001',
      studyId: 42,
      studyName: 'Test',
      funderName: '',
      funderProgram: '',
      grantNumber: '',
      projectTitle: '',
      startDate: '',
      endDate: '',
      url: '',
      tags: [],
    }
    const result = fundingResourceAsset.getStudyIdsForSelection([row], [1])
    expect(result).toEqual([])
  })
})

describe('fundingResourceAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = fundingResourceAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = fundingResourceAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('studyName')
    expect(fields).toContain('fundingId')
    expect(fields).toContain('funderName')
    expect(fields).toContain('projectTitle')
    expect(fields).toContain('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = fundingResourceAsset.makeColumns()
    const b = fundingResourceAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})
