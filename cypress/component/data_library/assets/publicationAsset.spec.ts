/**
 * Unit tests for publicationAsset — the Publications AssetDefinition.
 *
 * These tests are purely logic-level (no DOM mounting) so they run quickly
 * in the Cypress component runner via plain `describe` / `it` blocks.
 */
import { publicationAsset } from 'src/components/data_library/assets/publicationAsset'
import { PublicationAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  PublicationStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination: PaginationState = { page: 0, pageSize: 25 }

/** Build a minimal PublicationStudyAggregationBucket */
const makeBucket = (
  studyId: number,
  publications: Array<{
    publicationId?: string
    title?: string
    journal?: string
    doi?: string
    pubmedId?: string
    publishedDate?: string
    authors?: Array<{ name: string }>
    url?: string
    tags?: string[]
    citation?: boolean
    datasetCitation?: string
  }> = [],
  studyName = 'Test Study',
): PublicationStudyAggregationBucket => ({
  key: studyId,
  doc_count: publications.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                publications: publications.map(p => ({
                  publicationId: p.publicationId,
                  title: p.title,
                  journal: p.journal,
                  doi: p.doi,
                  pubmedId: p.pubmedId,
                  publishedDate: p.publishedDate,
                  authors: p.authors,
                  url: p.url,
                  tags: p.tags,
                  citation: p.citation,
                  datasetCitation: p.datasetCitation,
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
  buckets: PublicationStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('publicationAsset — label', () => {
  it('has singular "Publication" and plural "Publications"', () => {
    expect(publicationAsset.label.singular).to.equal('Publication')
    expect(publicationAsset.label.plural).to.equal('Publications')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('publicationAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(publicationAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('publicationAsset — searchFields', () => {
  it('includes publication-specific fields', () => {
    expect(publicationAsset.searchFields).to.include('study.assets.publications.title')
    expect(publicationAsset.searchFields).to.include('study.assets.publications.journal')
    expect(publicationAsset.searchFields).to.include('study.assets.publications.doi')
    expect(publicationAsset.searchFields).to.include('study.assets.publications.pubmedId')
  })

  it('includes study-level fields', () => {
    expect(publicationAsset.searchFields).to.include('study.studyName')
    expect(publicationAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('publicationAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'open' },
    }
    const q = publicationAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = publicationAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('publicationAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = publicationAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('flattens publications from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ publicationId: 'p1', title: 'Alpha' }, { publicationId: 'p2', title: 'Beta' }]),
      makeBucket(2, [{ publicationId: 'p3', title: 'Gamma' }]),
    ])
    const result = publicationAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
  })

  it('maps fields correctly from bucket to PublicationAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        publicationId: 'pub-xyz',
        title: 'A Novel Method',
        journal: 'Nature',
        doi: '10.1038/test',
        pubmedId: '99887766',
        publishedDate: '2024-06-01',
        authors: [{ name: 'Alice' }, { name: 'Bob' }],
        url: 'https://example.com',
        tags: ['genomics', 'GWAS'],
        citation: true,
        datasetCitation: 'DUOS-999',
      }], 'NHGRI Study'),
    ])
    const result = publicationAsset.transformResponse(response, pagination)
    const row = result.items[0] as PublicationAsset
    expect(row.publicationId).to.equal('pub-xyz')
    expect(row.studyId).to.equal(42)
    expect(row.studyName).to.equal('NHGRI Study')
    expect(row.title).to.equal('A Novel Method')
    expect(row.journal).to.equal('Nature')
    expect(row.doi).to.equal('10.1038/test')
    expect(row.pubmedId).to.equal('99887766')
    expect(row.publishedDate).to.equal('2024-06-01')
    expect(row.authorNames).to.deep.equal(['Alice', 'Bob'])
    expect(row.url).to.equal('https://example.com')
    expect(row.tags).to.deep.equal(['genomics', 'GWAS'])
    expect(row.citation).to.equal(true)
    expect(row.datasetCitation).to.equal('DUOS-999')
  })

  it('falls back to composite key when publicationId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ title: 'No ID Pub' }]),
    ])
    const result = publicationAsset.transformResponse(response, pagination)
    const row = result.items[0] as PublicationAsset
    // composite fallback: `${bucket.key}-${index}`
    expect(row.publicationId).to.equal('99-0')
  })

  it('applies client-side pagination', () => {
    const pubs = Array.from({ length: 30 }, (_, i) => ({
      publicationId: `p${i}`,
      title: `Publication ${i}`,
    }))
    const response = makeResponse([makeBucket(1, pubs)])

    const page0 = publicationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).to.have.length(10)
    expect((page0.items[0] as PublicationAsset).title).to.equal('Publication 0')

    const page1 = publicationAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect((page1.items[0] as PublicationAsset).title).to.equal('Publication 10')

    const page2 = publicationAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as PublicationAsset).title).to.equal('Publication 20')
  })

  it('reports total as the number of all publications across all studies', () => {
    const pubs = Array.from({ length: 30 }, (_, i) => ({ publicationId: `p${i}` }))
    const response = makeResponse([makeBucket(1, pubs)])
    const result = publicationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).to.equal(30)
  })

  it('builds authorNames from the authors array', () => {
    const response = makeResponse([
      makeBucket(1, [{
        publicationId: 'p1',
        authors: [{ name: 'Dr. Smith' }, { name: 'Prof. Jones' }, { name: '' }],
      }]),
    ])
    const row = publicationAsset.transformResponse(response, pagination).items[0] as PublicationAsset
    // empty-string names should be filtered out
    expect(row.authorNames).to.deep.equal(['Dr. Smith', 'Prof. Jones'])
  })

  it('returns empty defaults for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = publicationAsset.transformResponse(response, pagination).items[0] as PublicationAsset
    expect(row.tags).to.deep.equal([])
    expect(row.authors).to.deep.equal([])
    expect(row.authorNames).to.deep.equal([])
    expect(row.title).to.equal('')
    expect(row.journal).to.equal('')
    expect(row.doi).to.equal('')
    expect(row.citation).to.equal(false)
  })

  it('handles a study bucket with no publications gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = publicationAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('returns only matching publications when a citation filter is present', () => {
    const response = makeResponse([
      makeBucket(1, [
        {
          publicationId: 'PUB-CITED',
          title: 'Cited Publication',
          citation: true,
        },
        {
          publicationId: 'PUB-NOT-CITED',
          title: 'Not Cited Publication',
          citation: false,
        },
      ]),
    ])

    const result = publicationAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      datasetsCited: true,
    })

    expect(result.items).to.have.length(1)
    expect((result.items[0] as PublicationAsset).publicationId).to.equal('PUB-CITED')
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

describe('publicationAsset — getRowId', () => {
  it('returns the publicationId of the row', () => {
    const row: PublicationAsset = {
      publicationId: 'abc-123',
      studyId: 1,
      studyName: '',
      title: '',
      publishedDate: '',
      authors: [],
      authorNames: [],
      datasetCitation: '',
      citation: false,
      journal: '',
      doi: '',
    }
    expect(publicationAsset.getRowId(row)).to.equal('abc-123')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

describe('publicationAsset — isRowSelectable', () => {
  it('always returns false — publications do not participate in access requests', () => {
    const row: PublicationAsset = {
      publicationId: 'p1',
      studyId: 1,
      studyName: '',
      title: '',
      publishedDate: '',
      authors: [],
      authorNames: [],
      datasetCitation: '',
      citation: false,
      journal: '',
      doi: '',
    }
    expect(publicationAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection
// ---------------------------------------------------------------------------

describe('publicationAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: PublicationAsset = {
      publicationId: 'p1',
      studyId: 1,
      studyName: '',
      title: '',
      publishedDate: '',
      authors: [],
      authorNames: [],
      datasetCitation: '',
      citation: false,
      journal: '',
      doi: '',
    }
    const result = publicationAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// selectionToDatasetIds
// ---------------------------------------------------------------------------

describe('publicationAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = publicationAsset.selectionToDatasetIds([], ['p1', 'p2'])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// getStudyIdsForSelection
// ---------------------------------------------------------------------------

describe('publicationAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: PublicationAsset = {
      publicationId: 'p1',
      studyId: 42,
      studyName: '',
      title: '',
      publishedDate: '',
      authors: [],
      authorNames: [],
      datasetCitation: '',
      citation: false,
      journal: '',
      doi: '',
    }
    const result = publicationAsset.getStudyIdsForSelection([row], [1])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('publicationAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = publicationAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes required field names', () => {
    const cols = publicationAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).to.include('title')
    expect(fields).to.include('studyName')
    expect(fields).to.include('journal')
    expect(fields).to.include('publishedDate')
    expect(fields).to.include('doi')
    expect(fields).to.include('authorNames')
    expect(fields).to.include('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = publicationAsset.makeColumns()
    const b = publicationAsset.makeColumns({})
    expect(a.map(c => c.field)).to.deep.equal(b.map(c => c.field))
  })
})
