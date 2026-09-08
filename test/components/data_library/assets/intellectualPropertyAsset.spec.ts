/**
 * Unit tests for intellectualPropertyAsset — the Intellectual Property AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { intellectualPropertyAsset } from 'src/components/data_library/assets/intellectualPropertyAsset'
import { IntellectualPropertyAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  IntellectualPropertyStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  ips: Array<{
    ipId?: string
    type?: string
    title?: string
    assignee?: string
    patentNumber?: string
    filingDate?: string
    status?: string
    url?: string
    contact?: string
    tags?: string[]
  }> = [],
  studyName = 'Test Study',
): IntellectualPropertyStudyAggregationBucket => ({
  key: studyId,
  doc_count: ips.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                intellectualProperties: ips.map(ip => ({
                  ipId: ip.ipId,
                  type: ip.type,
                  title: ip.title,
                  assignee: ip.assignee,
                  patentNumber: ip.patentNumber,
                  filingDate: ip.filingDate,
                  status: ip.status,
                  url: ip.url,
                  contact: ip.contact,
                  tags: ip.tags,
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
  buckets: IntellectualPropertyStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('intellectualPropertyAsset — label', () => {
  it('has singular "Intellectual Property" and plural "Intellectual Properties"', () => {
    expect(intellectualPropertyAsset.label.singular).toBe('Intellectual Property')
    expect(intellectualPropertyAsset.label.plural).toBe('Intellectual Properties')
  })
})

describe('intellectualPropertyAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(intellectualPropertyAsset.sortingMode).toBe('client')
  })
})

describe('intellectualPropertyAsset — searchFields', () => {
  it('includes IP-specific fields', () => {
    expect(intellectualPropertyAsset.searchFields).toContain('study.assets.intellectualProperties.title')
    expect(intellectualPropertyAsset.searchFields).toContain('study.assets.intellectualProperties.type')
    expect(intellectualPropertyAsset.searchFields).toContain('study.assets.intellectualProperties.assignee')
    expect(intellectualPropertyAsset.searchFields).toContain('study.assets.intellectualProperties.patentNumber')
    expect(intellectualPropertyAsset.searchFields).toContain('study.assets.intellectualProperties.status')
  })

  it('includes study-level fields', () => {
    expect(intellectualPropertyAsset.searchFields).toContain('study.studyName')
    expect(intellectualPropertyAsset.searchFields).toContain('study.piName')
  })
})

describe('intellectualPropertyAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'open' },
    }
    const q = intellectualPropertyAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('intellectualPropertyAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = intellectualPropertyAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens IPs from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ ipId: 'ip1', title: 'Alpha' }, { ipId: 'ip2', title: 'Beta' }]),
      makeBucket(2, [{ ipId: 'ip3', title: 'Gamma' }]),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to IntellectualPropertyAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        ipId: 'ip-abc',
        type: 'Patent',
        title: 'Novel Method',
        assignee: 'Broad Institute',
        patentNumber: 'US12345678',
        filingDate: '2023-06-15',
        status: 'Granted',
        url: 'https://patents.example.com/US12345678',
        contact: 'ip@broadinstitute.org',
        tags: ['genomics'],
      }], 'My Study'),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    const row = result.items[0] as IntellectualPropertyAsset
    expect(row.ipId).toBe('ip-abc')
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('My Study')
    expect(row.type).toBe('Patent')
    expect(row.title).toBe('Novel Method')
    expect(row.assignee).toBe('Broad Institute')
    expect(row.patentNumber).toBe('US12345678')
    expect(row.filingDate).toBe('2023-06-15')
    expect(row.status).toBe('Granted')
    expect(row.url).toBe('https://patents.example.com/US12345678')
    expect(row.contact).toBe('ip@broadinstitute.org')
    expect(row.tags).toEqual(['genomics'])
  })

  it('falls back to composite key when ipId is absent', () => {
    const response = makeResponse([
      makeBucket(10, [{ title: 'No ID' }]),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    const row = result.items[0] as IntellectualPropertyAsset
    expect(row.ipId).toBe('10-0')
  })

  it('defaults missing string fields to empty string', () => {
    const response = makeResponse([
      makeBucket(5, [{ ipId: 'ip-x' }]),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    const row = result.items[0] as IntellectualPropertyAsset
    expect(row.type).toBe('')
    expect(row.title).toBe('')
    expect(row.assignee).toBe('')
    expect(row.patentNumber).toBe('')
    expect(row.filingDate).toBe('')
    expect(row.status).toBe('')
    expect(row.url).toBe('')
    expect(row.contact).toBe('')
    expect(row.tags).toEqual([])
  })

  it('applies client-side pagination correctly', () => {
    const ips = Array.from({ length: 30 }, (_, i) => ({ ipId: `ip-${i}`, title: `IP ${i}` }))
    const response = makeResponse([makeBucket(1, ips)])
    const page1 = intellectualPropertyAsset.transformResponse(response, { page: 0, pageSize: 10 })
    const page2 = intellectualPropertyAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect(page1.total).toBe(30)
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as IntellectualPropertyAsset).ipId).toBe('ip-10')
  })

  // The ES clause for ipFiledDate only decides which studies are aggregated;
  // every IP asset of a qualifying study comes back, so transformResponse must
  // re-check each row or the grid and count badge include out-of-range rows.
  it('returns only assets filed within the ipFiledDate range', () => {
    const response = makeResponse([
      makeBucket(1, [
        { ipId: 'ip-old', filingDate: '2019-05-01' },
        { ipId: 'ip-in-range', filingDate: '2022-03-01' },
        { ipId: 'ip-new', filingDate: '2025-01-01' },
      ]),
    ])

    const result = intellectualPropertyAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      ipFiledDate: { after: '2020-01-01', before: '2023-12-31' },
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as IntellectualPropertyAsset).ipId).toBe('ip-in-range')
  })

  // An inverted range builds no ES clause, so it must not narrow rows here
  // either — otherwise the grid empties while the panel flags the range.
  it('ignores an inverted ipFiledDate range instead of filtering everything out', () => {
    const response = makeResponse([
      makeBucket(1, [
        { ipId: 'ip-old', filingDate: '2019-05-01' },
        { ipId: 'ip-new', filingDate: '2025-01-01' },
      ]),
    ])

    const result = intellectualPropertyAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      ipFiledDate: { after: '2024-01-01', before: '2020-01-01' },
    })

    expect(result.total).toBe(2)
  })

  it('handles studies with no intellectualProperties assets', () => {
    const response = makeResponse([makeBucket(7, [])])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })
})

describe('intellectualPropertyAsset — getRowId', () => {
  it('returns the ipId', () => {
    const row: IntellectualPropertyAsset = {
      ipId: 'ip-xyz',
      studyId: 1,
      studyName: 'Study',
      type: 'Patent',
      title: 'Title',
      assignee: 'Org',
      patentNumber: 'US000',
      filingDate: '2024-01-01',
      status: 'Pending',
      url: '',
      contact: '',
    }
    expect(intellectualPropertyAsset.getRowId(row)).toBe('ip-xyz')
  })
})

describe('intellectualPropertyAsset — isRowSelectable', () => {
  it('returns false (IPs do not participate in access requests)', () => {
    const row: IntellectualPropertyAsset = {
      ipId: 'ip-1',
      studyId: 1,
      studyName: 'Study',
      type: 'Patent',
      title: 'Title',
      assignee: 'Org',
      patentNumber: 'US000',
      filingDate: '2024-01-01',
      status: 'Granted',
      url: '',
      contact: '',
    }
    expect(intellectualPropertyAsset.isRowSelectable(row)).toBe(false)
  })
})

describe('intellectualPropertyAsset — selection helpers', () => {
  it('computeRowSelection always returns an empty Set', () => {
    const set = intellectualPropertyAsset.computeRowSelection([], [1, 2, 3])
    expect(set.size).toBe(0)
  })

  it('selectionToDatasetIds always returns an empty array', () => {
    const ids = intellectualPropertyAsset.selectionToDatasetIds([], ['ip-1', 'ip-2'])
    expect(ids).toEqual([])
  })

  it('getStudyIdsForSelection always returns an empty array', () => {
    const ids = intellectualPropertyAsset.getStudyIdsForSelection([], [1, 2])
    expect(ids).toEqual([])
  })
})

describe('intellectualPropertyAsset — makeColumns', () => {
  it('returns an array of column definitions', () => {
    const cols = intellectualPropertyAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes expected field names', () => {
    const fields = intellectualPropertyAsset.makeColumns().map(c => c.field)
    expect(fields).toContain('title')
    expect(fields).toContain('type')
    expect(fields).toContain('patentNumber')
    expect(fields).toContain('assignee')
    expect(fields).toContain('status')
    expect(fields).toContain('filingDate')
    expect(fields).toContain('studyName')
    expect(fields).toContain('contact')
    expect(fields).toContain('tags')
  })
})
