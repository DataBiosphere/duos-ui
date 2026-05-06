/**
 * Unit tests for presentationAsset — the Presentations AssetDefinition.
 *
 * These tests are purely logic-level (no DOM mounting) so they run quickly
 * in the Cypress component runner via plain `describe` / `it` blocks.
 */
import { presentationAsset } from 'src/components/data_library/assets/presentationAsset'
import { PresentationAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  PresentationStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination: PaginationState = { page: 0, pageSize: 25 }

/** Build a minimal PresentationStudyAggregationBucket */
const makeBucket = (
  studyId: number,
  presentations: Array<{
    presentationId?: string
    title?: string
    date?: string
    url?: string
    authors?: string
    event?: string
    location?: string
    format?: string
    access?: string
    tags?: string[]
    citation?: boolean
    datasetCitation?: string
    presenter?: { name?: string, email?: string }
  }> = [],
  studyName = 'Test Study',
): PresentationStudyAggregationBucket => ({
  key: studyId,
  doc_count: presentations.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                presentations: presentations.map(p => ({
                  presentationId: p.presentationId,
                  title: p.title,
                  date: p.date,
                  url: p.url,
                  authors: p.authors,
                  event: p.event,
                  location: p.location,
                  format: p.format,
                  access: p.access,
                  tags: p.tags,
                  citation: p.citation,
                  datasetCitation: p.datasetCitation,
                  presenter: p.presenter,
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
  buckets: PresentationStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('presentationAsset — label', () => {
  it('has singular "Presentation" and plural "Presentations"', () => {
    expect(presentationAsset.label.singular).to.equal('Presentation')
    expect(presentationAsset.label.plural).to.equal('Presentations')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('presentationAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(presentationAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('presentationAsset — searchFields', () => {
  it('includes presentation-specific fields', () => {
    expect(presentationAsset.searchFields).to.include('study.assets.presentations.title')
    expect(presentationAsset.searchFields).to.include('study.assets.presentations.event')
    expect(presentationAsset.searchFields).to.include('study.assets.presentations.location')
    expect(presentationAsset.searchFields).to.include('study.assets.presentations.authors')
    expect(presentationAsset.searchFields).to.include('study.assets.presentations.format')
  })

  it('includes study-level fields', () => {
    expect(presentationAsset.searchFields).to.include('study.studyName')
    expect(presentationAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('presentationAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'open' },
    }
    const q = presentationAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = presentationAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('presentationAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = presentationAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('flattens presentations from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ presentationId: 'pr1', title: 'Alpha' }, { presentationId: 'pr2', title: 'Beta' }]),
      makeBucket(2, [{ presentationId: 'pr3', title: 'Gamma' }]),
    ])
    const result = presentationAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
  })

  it('maps fields correctly from bucket to PresentationAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        presentationId: 'pres-xyz',
        title: 'Data Sharing in Practice',
        date: '2024-10-01',
        url: 'https://example.com/slides',
        authors: 'Alice Smith, Bob Jones',
        event: 'ASHG 2024',
        location: 'Denver, CO',
        format: 'Oral',
        access: 'open',
        tags: ['genomics', 'data-sharing'],
        citation: true,
        datasetCitation: 'DUOS-999',
        presenter: { name: 'Alice Smith', email: 'alice@example.com' },
      }], 'NHGRI Study'),
    ])
    const result = presentationAsset.transformResponse(response, pagination)
    const row = result.items[0] as PresentationAsset
    expect(row.presentationId).to.equal('pres-xyz')
    expect(row.studyId).to.equal(42)
    expect(row.studyName).to.equal('NHGRI Study')
    expect(row.title).to.equal('Data Sharing in Practice')
    expect(row.date).to.equal('2024-10-01')
    expect(row.url).to.equal('https://example.com/slides')
    expect(row.authors).to.equal('Alice Smith, Bob Jones')
    expect(row.event).to.equal('ASHG 2024')
    expect(row.location).to.equal('Denver, CO')
    expect(row.format).to.equal('Oral')
    expect(row.access).to.equal('open')
    expect(row.tags).to.deep.equal(['genomics', 'data-sharing'])
    expect(row.citation).to.equal(true)
    expect(row.datasetCitation).to.equal('DUOS-999')
    expect(row.presenter?.name).to.equal('Alice Smith')
    expect(row.presenter?.email).to.equal('alice@example.com')
  })

  it('falls back to composite key when presentationId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ title: 'No ID Pres' }]),
    ])
    const result = presentationAsset.transformResponse(response, pagination)
    const row = result.items[0] as PresentationAsset
    // composite fallback: `${bucket.key}-${index}`
    expect(row.presentationId).to.equal('99-0')
  })

  it('applies client-side pagination', () => {
    const preses = Array.from({ length: 30 }, (_, i) => ({
      presentationId: `pr${i}`,
      title: `Presentation ${i}`,
    }))
    const response = makeResponse([makeBucket(1, preses)])

    const page0 = presentationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).to.have.length(10)
    expect((page0.items[0] as PresentationAsset).title).to.equal('Presentation 0')

    const page1 = presentationAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect((page1.items[0] as PresentationAsset).title).to.equal('Presentation 10')

    const page2 = presentationAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as PresentationAsset).title).to.equal('Presentation 20')
  })

  it('reports total as the number of all presentations across all studies', () => {
    const preses = Array.from({ length: 30 }, (_, i) => ({ presentationId: `pr${i}` }))
    const response = makeResponse([makeBucket(1, preses)])
    const result = presentationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).to.equal(30)
  })

  it('returns empty defaults for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = presentationAsset.transformResponse(response, pagination).items[0] as PresentationAsset
    expect(row.tags).to.deep.equal([])
    expect(row.title).to.equal('')
    expect(row.date).to.equal('')
    expect(row.authors).to.equal('')
    expect(row.event).to.equal('')
    expect(row.location).to.equal('')
    expect(row.format).to.equal('')
    expect(row.citation).to.equal(false)
  })

  it('handles a study bucket with no presentations gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = presentationAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('returns only matching presentations when filtered within a shared study', () => {
    const response = makeResponse([
      makeBucket(1, [
        {
          presentationId: 'PRES-CITED',
          title: 'Cited',
          citation: true,
        },
        {
          presentationId: 'PRES-NOT-CITED',
          title: 'Not Cited',
          citation: false,
        },
      ]),
    ])

    const result = presentationAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      datasetsCited: true,
    })

    expect(result.items).to.have.length(1)
    expect((result.items[0] as PresentationAsset).presentationId).to.equal('PRES-CITED')
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

describe('presentationAsset — getRowId', () => {
  it('returns the presentationId of the row', () => {
    const row: PresentationAsset = {
      presentationId: 'abc-123',
      studyId: 1,
      studyName: '',
      title: '',
      date: '',
      citation: false,
    }
    expect(presentationAsset.getRowId(row)).to.equal('abc-123')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

describe('presentationAsset — isRowSelectable', () => {
  it('always returns false — presentations do not participate in access requests', () => {
    const row: PresentationAsset = {
      presentationId: 'pr1',
      studyId: 1,
      studyName: '',
      title: '',
      date: '',
      citation: false,
    }
    expect(presentationAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection
// ---------------------------------------------------------------------------

describe('presentationAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: PresentationAsset = {
      presentationId: 'pr1',
      studyId: 1,
      studyName: '',
      title: '',
      date: '',
      citation: false,
    }
    const result = presentationAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// selectionToDatasetIds
// ---------------------------------------------------------------------------

describe('presentationAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = presentationAsset.selectionToDatasetIds([], ['pr1', 'pr2'])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// getStudyIdsForSelection
// ---------------------------------------------------------------------------

describe('presentationAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: PresentationAsset = {
      presentationId: 'pr1',
      studyId: 42,
      studyName: '',
      title: '',
      date: '',
      citation: false,
    }
    const result = presentationAsset.getStudyIdsForSelection([row], [1])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('presentationAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = presentationAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes required field names', () => {
    const cols = presentationAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).to.include('title')
    expect(fields).to.include('studyName')
    expect(fields).to.include('event')
    expect(fields).to.include('date')
    expect(fields).to.include('location')
    expect(fields).to.include('presenter')
    expect(fields).to.include('format')
    expect(fields).to.include('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = presentationAsset.makeColumns()
    const b = presentationAsset.makeColumns({})
    expect(a.map(c => c.field)).to.deep.equal(b.map(c => c.field))
  })
})
