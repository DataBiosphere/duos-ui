/**
 * Unit tests for intellectualPropertyAsset — the Intellectual Property AssetDefinition.
 *
 * These tests are purely logic-level (no DOM mounting) so they run quickly
 * in the Cypress component runner via plain `describe` / `it` blocks.
 */
import { intellectualPropertyAsset } from 'src/components/data_library/assets/intellectualPropertyAsset'
import { IntellectualPropertyAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  IntellectualPropertyStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination: PaginationState = { page: 0, pageSize: 25 }

/** Build a minimal IntellectualPropertyStudyAggregationBucket */
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

/** Wrap buckets in a full ElasticsearchResponse */
const makeResponse = (
  buckets: IntellectualPropertyStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — label', () => {
  it('has singular "Intellectual Property" and plural "Intellectual Properties"', () => {
    expect(intellectualPropertyAsset.label.singular).to.equal('Intellectual Property')
    expect(intellectualPropertyAsset.label.plural).to.equal('Intellectual Properties')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(intellectualPropertyAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — searchFields', () => {
  it('includes IP-specific fields', () => {
    expect(intellectualPropertyAsset.searchFields).to.include('study.assets.intellectualProperties.title')
    expect(intellectualPropertyAsset.searchFields).to.include('study.assets.intellectualProperties.type')
    expect(intellectualPropertyAsset.searchFields).to.include('study.assets.intellectualProperties.assignee')
    expect(intellectualPropertyAsset.searchFields).to.include('study.assets.intellectualProperties.patentNumber')
    expect(intellectualPropertyAsset.searchFields).to.include('study.assets.intellectualProperties.status')
  })

  it('includes study-level fields', () => {
    expect(intellectualPropertyAsset.searchFields).to.include('study.studyName')
    expect(intellectualPropertyAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'open' },
    }
    const q = intellectualPropertyAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'title', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = intellectualPropertyAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = intellectualPropertyAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('flattens IPs from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ ipId: 'ip1', title: 'Alpha' }, { ipId: 'ip2', title: 'Beta' }]),
      makeBucket(2, [{ ipId: 'ip3', title: 'Gamma' }]),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
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
    expect(row.ipId).to.equal('ip-abc')
    expect(row.studyId).to.equal(42)
    expect(row.studyName).to.equal('My Study')
    expect(row.type).to.equal('Patent')
    expect(row.title).to.equal('Novel Method')
    expect(row.assignee).to.equal('Broad Institute')
    expect(row.patentNumber).to.equal('US12345678')
    expect(row.filingDate).to.equal('2023-06-15')
    expect(row.status).to.equal('Granted')
    expect(row.url).to.equal('https://patents.example.com/US12345678')
    expect(row.contact).to.equal('ip@broadinstitute.org')
    expect(row.tags).to.deep.equal(['genomics'])
  })

  it('falls back to composite key when ipId is absent', () => {
    const response = makeResponse([
      makeBucket(10, [{ title: 'No ID' }]),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    const row = result.items[0] as IntellectualPropertyAsset
    expect(row.ipId).to.equal('10-0')
  })

  it('defaults missing string fields to empty string', () => {
    const response = makeResponse([
      makeBucket(5, [{ ipId: 'ip-x' }]),
    ])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    const row = result.items[0] as IntellectualPropertyAsset
    expect(row.type).to.equal('')
    expect(row.title).to.equal('')
    expect(row.assignee).to.equal('')
    expect(row.patentNumber).to.equal('')
    expect(row.filingDate).to.equal('')
    expect(row.status).to.equal('')
    expect(row.url).to.equal('')
    expect(row.contact).to.equal('')
    expect(row.tags).to.deep.equal([])
  })

  it('applies client-side pagination correctly', () => {
    const ips = Array.from({ length: 30 }, (_, i) => ({ ipId: `ip-${i}`, title: `IP ${i}` }))
    const response = makeResponse([makeBucket(1, ips)])
    const page1 = intellectualPropertyAsset.transformResponse(response, { page: 0, pageSize: 10 })
    const page2 = intellectualPropertyAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect(page1.total).to.equal(30)
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as IntellectualPropertyAsset).ipId).to.equal('ip-10')
  })

  it('handles studies with no intellectualProperties assets', () => {
    const response = makeResponse([makeBucket(7, [])])
    const result = intellectualPropertyAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

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
    expect(intellectualPropertyAsset.getRowId(row)).to.equal('ip-xyz')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

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
    expect(intellectualPropertyAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection / selectionToDatasetIds / getStudyIdsForSelection
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — selection helpers', () => {
  it('computeRowSelection always returns an empty Set', () => {
    const set = intellectualPropertyAsset.computeRowSelection([], [1, 2, 3])
    expect(set.size).to.equal(0)
  })

  it('selectionToDatasetIds always returns an empty array', () => {
    const ids = intellectualPropertyAsset.selectionToDatasetIds([], ['ip-1', 'ip-2'])
    expect(ids).to.deep.equal([])
  })

  it('getStudyIdsForSelection always returns an empty array', () => {
    const ids = intellectualPropertyAsset.getStudyIdsForSelection([], [1, 2])
    expect(ids).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('intellectualPropertyAsset — makeColumns', () => {
  it('returns an array of column definitions', () => {
    const cols = intellectualPropertyAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes expected field names', () => {
    const fields = intellectualPropertyAsset.makeColumns().map(c => c.field)
    expect(fields).to.include('title')
    expect(fields).to.include('type')
    expect(fields).to.include('patentNumber')
    expect(fields).to.include('assignee')
    expect(fields).to.include('status')
    expect(fields).to.include('filingDate')
    expect(fields).to.include('studyName')
    expect(fields).to.include('contact')
    expect(fields).to.include('tags')
  })
})
