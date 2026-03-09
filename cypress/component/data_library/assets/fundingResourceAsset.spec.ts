import { FundingResourceAsset as FundingResourceRow, PaginationState, SortState } from 'src/types/library'
import { ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { fundingResourceAsset } from 'src/components/data_library/assets/fundingResourceAsset'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aggregations: { studies: { buckets } as any },
  }) as ElasticsearchResponse

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — label', () => {
  it('has singular "FundingResource" and plural "FundingResources"', () => {
    expect(fundingResourceAsset.label.singular).to.equal('FundingResource')
    expect(fundingResourceAsset.label.plural).to.equal('FundingResources')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(fundingResourceAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — searchFields', () => {
  it('includes funding-specific fields', () => {
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.fundingId')
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.funderName')
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.funderProgram')
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.grantNumber')
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.projectTitle')
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.url')
    expect(fundingResourceAsset.searchFields).to.include('study.assets.funding.tags')
  })

  it('includes study-level fields', () => {
    expect(fundingResourceAsset.searchFields).to.include('study.studyName')
    expect(fundingResourceAsset.searchFields).to.include('study.description')
    expect(fundingResourceAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study.assets.funding' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as { terms: { field: string, size: number } }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal(
      'study.assets.funding',
    )
  })

  it('omits filter when filterQuery is empty', () => {
    const q = fundingResourceAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = { term: { 'accessManagement.keyword': 'controlled' } }
    const q = fundingResourceAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'fundingId', order: 'asc' }
    const largePagination: PaginationState = { page: 5, pageSize: 100 }
    const q = fundingResourceAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = fundingResourceAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
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
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
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
    expect(row.fundingId).to.equal('FR-12345')
    expect(row.studyId).to.equal('42')
    expect(row.studyName).to.equal('NHGRI Study')
    expect(row.funderName).to.equal('NIH')
    expect(row.funderProgram).to.equal('R01')
    expect(row.grantNumber).to.equal('R01-ABC')
    expect(row.projectTitle).to.equal('Project Atlas')
    expect(row.startDate).to.equal('2023-01-15')
    expect(row.endDate).to.equal('2024-01-14')
    expect(row.url).to.equal('https://example.org/grant')
    expect(row.tags).to.deep.equal(['genomics', 'rare-disease'])
  })

  it('falls back to composite key when fundingId is absent', () => {
    const response = makeResponse([makeBucket('99', [{ funderName: 'NSF' }])])
    const result = fundingResourceAsset.transformResponse(response, pagination)
    const row = result.items[0] as FundingResourceRow
    expect(row.fundingId).to.equal('99-0')
  })

  it('applies client-side pagination', () => {
    const funding = Array.from({ length: 30 }, (_, i) => ({
      fundingId: `FR-${String(i).padStart(3, '0')}`,
      funderName: `Funder-${i}`,
    }))
    const response = makeResponse([makeBucket('1', funding)])

    const page0 = fundingResourceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).to.have.length(10)
    expect((page0.items[0] as FundingResourceRow).fundingId).to.equal('FR-000')

    const page1 = fundingResourceAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect((page1.items[0] as FundingResourceRow).fundingId).to.equal('FR-010')

    const page2 = fundingResourceAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as FundingResourceRow).fundingId).to.equal('FR-020')
  })

  it('reports total as all funding resources across all studies', () => {
    const funding = Array.from({ length: 30 }, (_, i) => ({ fundingId: `FR-${i}` }))
    const response = makeResponse([makeBucket('1', funding)])
    const result = fundingResourceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).to.equal(30)
  })

  it('returns empty/default values for missing fields', () => {
    const response = makeResponse([makeBucket('1', [{}])])
    const row = fundingResourceAsset.transformResponse(response, pagination).items[0] as FundingResourceRow
    expect(row.fundingId).to.equal('1-0')
    expect(row.studyName).to.equal('Test Study')
    expect(row.funderName).to.equal('')
    expect(row.funderProgram).to.equal('')
    expect(row.grantNumber).to.equal('')
    expect(row.projectTitle).to.equal('')
    expect(row.startDate).to.equal('')
    expect(row.endDate).to.equal('')
    expect(row.url).to.equal('')
    expect(row.tags).to.deep.equal([])
  })

  it('handles a study bucket with no funding resources gracefully', () => {
    const response = makeResponse([makeBucket('1', [])])
    const result = fundingResourceAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

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
    expect(fundingResourceAsset.getRowId(row)).to.equal('FR-xyz-789')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

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
    expect(fundingResourceAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection
// ---------------------------------------------------------------------------

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
    expect(result.size).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// selectionToDatasetIds
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = fundingResourceAsset.selectionToDatasetIds([], ['FR-001', 'FR-002'])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// getStudyIdsForSelection
// ---------------------------------------------------------------------------

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
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('fundingResourceAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = fundingResourceAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes required field names', () => {
    const cols = fundingResourceAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).to.include('studyName')
    expect(fields).to.include('fundingId')
    expect(fields).to.include('funderName')
    expect(fields).to.include('projectTitle')
    expect(fields).to.include('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = fundingResourceAsset.makeColumns()
    const b = fundingResourceAsset.makeColumns({})
    expect(a.map(c => c.field)).to.deep.equal(b.map(c => c.field))
  })
})
