/**
 * Unit tests for publicationAsset — the Publications AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { publicationAsset } from 'src/components/data_library/assets/publicationAsset'
import { PublicationAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  PublicationStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

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
    access?: string
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
                  access: p.access,
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

const makeResponse = (
  buckets: PublicationStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('publicationAsset — label', () => {
  it('has singular "Publication" and plural "Publications"', () => {
    expect(publicationAsset.label.singular).toBe('Publication')
    expect(publicationAsset.label.plural).toBe('Publications')
  })
})

describe('publicationAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(publicationAsset.sortingMode).toBe('client')
  })
})

describe('publicationAsset — searchFields', () => {
  it('includes publication-specific fields', () => {
    expect(publicationAsset.searchFields).toContain('study.assets.publications.title')
    expect(publicationAsset.searchFields).toContain('study.assets.publications.journal')
    expect(publicationAsset.searchFields).toContain('study.assets.publications.doi')
    expect(publicationAsset.searchFields).toContain('study.assets.publications.pubmedId')
  })

  it('includes study-level fields', () => {
    expect(publicationAsset.searchFields).toContain('study.studyName')
    expect(publicationAsset.searchFields).toContain('study.piName')
  })
})

describe('publicationAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = publicationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'open' },
    }
    const q = publicationAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = publicationAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('publicationAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = publicationAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens publications from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ publicationId: 'p1', title: 'Alpha' }, { publicationId: 'p2', title: 'Beta' }]),
      makeBucket(2, [{ publicationId: 'p3', title: 'Gamma' }]),
    ])
    const result = publicationAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
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
    expect(row.publicationId).toBe('pub-xyz')
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.title).toBe('A Novel Method')
    expect(row.journal).toBe('Nature')
    expect(row.doi).toBe('10.1038/test')
    expect(row.pubmedId).toBe('99887766')
    expect(row.publishedDate).toBe('2024-06-01')
    expect(row.authorNames).toEqual(['Alice', 'Bob'])
    expect(row.url).toBe('https://example.com')
    expect(row.tags).toEqual(['genomics', 'GWAS'])
    expect(row.citation).toBe(true)
    expect(row.datasetCitation).toBe('DUOS-999')
  })

  it('falls back to composite key when publicationId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ title: 'No ID Pub' }]),
    ])
    const result = publicationAsset.transformResponse(response, pagination)
    const row = result.items[0] as PublicationAsset
    expect(row.publicationId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const pubs = Array.from({ length: 30 }, (_, i) => ({
      publicationId: `p${i}`,
      title: `Publication ${i}`,
    }))
    const response = makeResponse([makeBucket(1, pubs)])

    const page0 = publicationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as PublicationAsset).title).toBe('Publication 0')

    const page1 = publicationAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as PublicationAsset).title).toBe('Publication 10')

    const page2 = publicationAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as PublicationAsset).title).toBe('Publication 20')
  })

  it('reports total as the number of all publications across all studies', () => {
    const pubs = Array.from({ length: 30 }, (_, i) => ({ publicationId: `p${i}` }))
    const response = makeResponse([makeBucket(1, pubs)])
    const result = publicationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('builds authorNames from the authors array', () => {
    const response = makeResponse([
      makeBucket(1, [{
        publicationId: 'p1',
        authors: [{ name: 'Dr. Smith' }, { name: 'Prof. Jones' }, { name: '' }],
      }]),
    ])
    const row = publicationAsset.transformResponse(response, pagination).items[0] as PublicationAsset
    expect(row.authorNames).toEqual(['Dr. Smith', 'Prof. Jones'])
  })

  it('returns empty defaults for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = publicationAsset.transformResponse(response, pagination).items[0] as PublicationAsset
    expect(row.tags).toEqual([])
    expect(row.authors).toEqual([])
    expect(row.authorNames).toEqual([])
    expect(row.title).toBe('')
    expect(row.journal).toBe('')
    expect(row.doi).toBe('')
    expect(row.citation).toBe(false)
  })

  it('handles a study bucket with no publications gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = publicationAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
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
      publicationsDatasetsCited: true,
    })

    expect(result.items).toHaveLength(1)
    expect((result.items[0] as PublicationAsset).publicationId).toBe('PUB-CITED')
  })

  it('returns only publications matching the journal filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { publicationId: 'p1', journal: 'Nature' },
        { publicationId: 'p2', journal: 'Cell' },
      ]),
    ])

    const result = publicationAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, publicationJournal: ['Nature'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as PublicationAsset).publicationId).toBe('p1')
  })

  it('returns only publications matching the access filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { publicationId: 'p1', access: 'open' },
        { publicationId: 'p2', access: 'restricted' },
      ]),
    ])

    const result = publicationAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, publicationAccess: ['open'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as PublicationAsset).publicationId).toBe('p1')
  })

  it('returns only publications within the publicationPublishedDate range', () => {
    const response = makeResponse([
      makeBucket(1, [
        { publicationId: 'p-old', publishedDate: '2019-05-01' },
        { publicationId: 'p-in-range', publishedDate: '2022-03-01' },
        { publicationId: 'p-new', publishedDate: '2025-01-01' },
      ]),
    ])

    const result = publicationAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      publicationPublishedDate: { after: '2020-01-01', before: '2023-12-31' },
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as PublicationAsset).publicationId).toBe('p-in-range')
  })
})

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
    expect(publicationAsset.getRowId(row)).toBe('abc-123')
  })
})

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
    expect(publicationAsset.isRowSelectable(row)).toBe(false)
  })
})

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
    expect(result.size).toBe(0)
  })
})

describe('publicationAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = publicationAsset.selectionToDatasetIds([], ['p1', 'p2'])
    expect(result).toEqual([])
  })
})

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
    expect(result).toEqual([])
  })
})

describe('publicationAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = publicationAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = publicationAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('title')
    expect(fields).toContain('studyName')
    expect(fields).toContain('journal')
    expect(fields).toContain('publishedDate')
    expect(fields).toContain('doi')
    expect(fields).toContain('access')
    expect(fields).toContain('authorNames')
    expect(fields).toContain('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = publicationAsset.makeColumns()
    const b = publicationAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})
