/**
 * Unit tests for presentationAsset — the Presentations AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { presentationAsset } from 'src/components/data_library/assets/presentationAsset'
import { PresentationAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  PresentationStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

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

const makeResponse = (
  buckets: PresentationStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('presentationAsset — label', () => {
  it('has singular "Presentation" and plural "Presentations"', () => {
    expect(presentationAsset.label.singular).toBe('Presentation')
    expect(presentationAsset.label.plural).toBe('Presentations')
  })
})

describe('presentationAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(presentationAsset.sortingMode).toBe('client')
  })
})

describe('presentationAsset — searchFields', () => {
  it('includes presentation-specific fields', () => {
    expect(presentationAsset.searchFields).toContain('study.assets.presentations.title')
    expect(presentationAsset.searchFields).toContain('study.assets.presentations.event')
    expect(presentationAsset.searchFields).toContain('study.assets.presentations.location')
    expect(presentationAsset.searchFields).toContain('study.assets.presentations.authors')
    expect(presentationAsset.searchFields).toContain('study.assets.presentations.format')
  })

  it('includes study-level fields', () => {
    expect(presentationAsset.searchFields).toContain('study.studyName')
    expect(presentationAsset.searchFields).toContain('study.piName')
  })
})

describe('presentationAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = presentationAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'open' },
    }
    const q = presentationAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = presentationAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('presentationAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = presentationAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens presentations from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ presentationId: 'pr1', title: 'Alpha' }, { presentationId: 'pr2', title: 'Beta' }]),
      makeBucket(2, [{ presentationId: 'pr3', title: 'Gamma' }]),
    ])
    const result = presentationAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
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
    expect(row.presentationId).toBe('pres-xyz')
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.title).toBe('Data Sharing in Practice')
    expect(row.date).toBe('2024-10-01')
    expect(row.url).toBe('https://example.com/slides')
    expect(row.authors).toBe('Alice Smith, Bob Jones')
    expect(row.event).toBe('ASHG 2024')
    expect(row.location).toBe('Denver, CO')
    expect(row.format).toBe('Oral')
    expect(row.access).toBe('open')
    expect(row.tags).toEqual(['genomics', 'data-sharing'])
    expect(row.citation).toBe(true)
    expect(row.datasetCitation).toBe('DUOS-999')
    expect(row.presenter?.name).toBe('Alice Smith')
    expect(row.presenter?.email).toBe('alice@example.com')
  })

  it('falls back to composite key when presentationId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ title: 'No ID Pres' }]),
    ])
    const result = presentationAsset.transformResponse(response, pagination)
    const row = result.items[0] as PresentationAsset
    expect(row.presentationId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const preses = Array.from({ length: 30 }, (_, i) => ({
      presentationId: `pr${i}`,
      title: `Presentation ${i}`,
    }))
    const response = makeResponse([makeBucket(1, preses)])

    const page0 = presentationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as PresentationAsset).title).toBe('Presentation 0')

    const page1 = presentationAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as PresentationAsset).title).toBe('Presentation 10')

    const page2 = presentationAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as PresentationAsset).title).toBe('Presentation 20')
  })

  it('reports total as the number of all presentations across all studies', () => {
    const preses = Array.from({ length: 30 }, (_, i) => ({ presentationId: `pr${i}` }))
    const response = makeResponse([makeBucket(1, preses)])
    const result = presentationAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty defaults for missing fields', () => {
    const response = makeResponse([makeBucket(1, [{}])])
    const row = presentationAsset.transformResponse(response, pagination).items[0] as PresentationAsset
    expect(row.tags).toEqual([])
    expect(row.title).toBe('')
    expect(row.date).toBe('')
    expect(row.authors).toBe('')
    expect(row.event).toBe('')
    expect(row.location).toBe('')
    expect(row.format).toBe('')
    expect(row.citation).toBe(false)
  })

  it('handles a study bucket with no presentations gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = presentationAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
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

    expect(result.items).toHaveLength(1)
    expect((result.items[0] as PresentationAsset).presentationId).toBe('PRES-CITED')
  })
})

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
    expect(presentationAsset.getRowId(row)).toBe('abc-123')
  })
})

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
    expect(presentationAsset.isRowSelectable(row)).toBe(false)
  })
})

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
    expect(result.size).toBe(0)
  })
})

describe('presentationAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = presentationAsset.selectionToDatasetIds([], ['pr1', 'pr2'])
    expect(result).toEqual([])
  })
})

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
    expect(result).toEqual([])
  })
})

describe('presentationAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = presentationAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = presentationAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('title')
    expect(fields).toContain('studyName')
    expect(fields).toContain('event')
    expect(fields).toContain('date')
    expect(fields).toContain('location')
    expect(fields).toContain('presenter')
    expect(fields).toContain('format')
    expect(fields).toContain('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = presentationAsset.makeColumns()
    const b = presentationAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})
