/**
 * Unit tests for workspaceAsset — the Workspaces AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { workspaceAsset } from 'src/components/data_library/assets/workspaceAsset'
import { WorkspaceAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  PartialWorkspaceAsset,
  WorkspaceStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  workspaces: Array<{
    workspaceId?: number
    name?: string
    platform?: string
    url?: string
    description?: string
    tools?: string[]
    cloud?: string[] | string
    access?: string
    tags?: string[]
  }> = [],
  studyName = 'Test Study',
): WorkspaceStudyAggregationBucket => ({
  key: studyId,
  doc_count: workspaces.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                workspaces: workspaces.map(w => ({
                  workspaceId: w.workspaceId,
                  name: w.name,
                  platform: w.platform,
                  url: w.url,
                  description: w.description,
                  tools: w.tools,
                  cloud: w.cloud,
                  access: w.access,
                  tags: w.tags,
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
  buckets: WorkspaceStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('workspaceAsset — label', () => {
  it('has singular "Workspace" and plural "Workspaces"', () => {
    expect(workspaceAsset.label.singular).toBe('Workspace')
    expect(workspaceAsset.label.plural).toBe('Workspaces')
  })
})

describe('workspaceAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(workspaceAsset.sortingMode).toBe('client')
  })
})

describe('workspaceAsset — searchFields', () => {
  it('includes workspace-specific fields', () => {
    expect(workspaceAsset.searchFields).toContain('study.assets.workspaces.name')
    expect(workspaceAsset.searchFields).toContain('study.assets.workspaces.platform')
    // Cloud is a displayed, filterable field, so free-text search must reach it.
    expect(workspaceAsset.searchFields).toContain('study.assets.workspaces.cloud')
    expect(workspaceAsset.searchFields).toContain('study.assets.workspaces.description')
    expect(workspaceAsset.searchFields).toContain('study.assets.workspaces.tools')
    expect(workspaceAsset.searchFields).toContain('study.assets.workspaces.tags')
  })

  it('includes study-level fields', () => {
    expect(workspaceAsset.searchFields).toContain('study.studyName')
    expect(workspaceAsset.searchFields).toContain('study.piName')
  })
})

describe('workspaceAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = workspaceAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = workspaceAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = workspaceAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = workspaceAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = workspaceAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'name', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = workspaceAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('workspaceAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = workspaceAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens workspaces from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ workspaceId: 1, name: 'Alpha' }, { workspaceId: 2, name: 'Beta' }]),
      makeBucket(2, [{ workspaceId: 3, name: 'Gamma' }]),
    ])
    const result = workspaceAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to WorkspaceAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        workspaceId: 4201,
        name: 'Terra Workspace',
        platform: 'Terra',
        url: 'https://app.terra.bio/#workspaces/test/example',
        description: 'A test workspace',
        tools: ['WDL', 'Jupyter'],
        access: 'open',
        tags: ['genomics', 'cloud'],
      }], 'NHGRI Study'),
    ])
    const result = workspaceAsset.transformResponse(response, pagination)
    const row = result.items[0] as WorkspaceAsset
    expect(row.workspaceId).toBe(4201)
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.name).toBe('Terra Workspace')
    expect(row.platform).toBe('Terra')
    expect(row.url).toBe('https://app.terra.bio/#workspaces/test/example')
    expect(row.description).toBe('A test workspace')
    expect(row.tools).toEqual(['WDL', 'Jupyter'])
    expect(row.access).toBe('open')
    expect(row.tags).toEqual(['genomics', 'cloud'])
  })

  it('uses the server-assigned row id as the row id', () => {
    const response = makeResponse([makeBucket(99, [{ workspaceId: 17 }])])
    const row = workspaceAsset.transformResponse(response, pagination).items[0] as WorkspaceAsset
    expect(row.workspaceId).toBe(17)
    expect(workspaceAsset.getRowId(row)).toBe(17)
  })

  it('renders no row for an entry without a row id', () => {
    const response = makeResponse([makeBucket(99, [{ name: 'No Id' }, { workspaceId: 17 }])])
    const result = workspaceAsset.transformResponse(response, pagination)
    expect(result.items.map(row => (row as WorkspaceAsset).workspaceId)).toEqual([17])
    expect(result.total).toBe(1)
  })

  it('renders no row for an indexed element that is not an object', () => {
    const bucket = makeBucket(99, [{ workspaceId: 17 }])
    const entries = bucket.study_details?.hits?.hits?.[0]?._source?.study?.assets?.workspaces
    entries?.push(...(['legacy', null, 7, [18]] as unknown as PartialWorkspaceAsset[]))
    const result = workspaceAsset.transformResponse(makeResponse([bucket]), pagination)
    expect(result.items.map(row => (row as WorkspaceAsset).workspaceId)).toEqual([17])
  })

  it('applies client-side pagination', () => {
    const workspaces = Array.from({ length: 30 }, (_, i) => ({
      workspaceId: i + 1,
      name: `Workspace ${i}`,
    }))
    const response = makeResponse([makeBucket(1, workspaces)])

    const page0 = workspaceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as WorkspaceAsset).name).toBe('Workspace 0')

    const page1 = workspaceAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as WorkspaceAsset).name).toBe('Workspace 10')

    const page2 = workspaceAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as WorkspaceAsset).name).toBe('Workspace 20')
  })

  it('reports total as the number of all workspaces across all studies (not just page)', () => {
    const workspaces = Array.from({ length: 30 }, (_, i) => ({ workspaceId: i + 1 }))
    const response = makeResponse([makeBucket(1, workspaces)])
    const result = workspaceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty tools / access / tags defaults for missing fields', () => {
    const response = makeResponse([
      makeBucket(1, [{ workspaceId: 1 }]),
    ])
    const row = workspaceAsset.transformResponse(response, pagination).items[0] as WorkspaceAsset
    expect(row.tools).toEqual([])
    expect(row.tags).toEqual([])
    expect(row.access).toBe('')
    expect(row.name).toBe('')
    expect(row.platform).toBe('')
    expect(row.description).toBe('')
  })

  it('handles a study bucket with no workspaces gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = workspaceAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  // Every workspace of a qualifying study comes back, so rows need re-checking.
  it('returns only workspaces matching the tools filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { workspaceId: 1, name: 'With Jupyter', tools: ['Jupyter', 'RStudio'] },
        { workspaceId: 2, name: 'Without Jupyter', tools: ['Galaxy'] },
      ]),
    ])

    const result = workspaceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      workspaceTools: ['jupyter'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as WorkspaceAsset).workspaceId).toBe(1)
  })

  it('returns only workspaces matching the platform filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { workspaceId: 1, platform: 'Terra' },
        { workspaceId: 2, platform: 'AnVIL' },
      ]),
    ])

    const result = workspaceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      workspacePlatform: ['Terra'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as WorkspaceAsset).workspaceId).toBe(1)
  })

  // `access` is a bare form field with no options or validator, and cloud is a
  // creatable select, so both carry whatever casing the submitter typed.
  it('matches the cloud filter regardless of the indexed casing', () => {
    const response = makeResponse([makeBucket(1, [{ workspaceId: 1, cloud: ['AWS'] }])])

    const result = workspaceAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, workspaceCloud: ['aws'] })

    expect(result.total).toBe(1)
  })

  it('matches the access filter regardless of the indexed casing', () => {
    const response = makeResponse([makeBucket(1, [{ workspaceId: 1, access: 'Open' }])])

    const result = workspaceAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, workspaceAccess: ['open'] })

    expect(result.total).toBe(1)
  })

  it('maps the cloud field onto the row', () => {
    const response = makeResponse([makeBucket(1, [{ workspaceId: 1, cloud: ['AWS', 'Azure'] }])])
    const row = workspaceAsset.transformResponse(response, pagination).items[0] as WorkspaceAsset
    expect(row.cloud).toEqual(['AWS', 'Azure'])
  })

  it('normalizes a cloud indexed as a bare string into an array', () => {
    const response = makeResponse([makeBucket(1, [{ workspaceId: 1, cloud: 'Azure' }])])
    const row = workspaceAsset.transformResponse(response, pagination).items[0] as WorkspaceAsset
    expect(row.cloud).toEqual(['Azure'])
  })

  it('matches the cloud filter against a cloud indexed as a bare string', () => {
    const response = makeResponse([
      makeBucket(1, [
        { workspaceId: 1, cloud: 'AWS' },
        { workspaceId: 2, cloud: 'GCP' },
      ]),
    ])

    const result = workspaceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      workspaceCloud: ['GCP'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as WorkspaceAsset).workspaceId).toBe(2)
  })

  it('returns only workspaces matching the cloud filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { workspaceId: 1, cloud: ['AWS'] },
        { workspaceId: 2, cloud: ['GCP'] },
      ]),
    ])

    const result = workspaceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      workspaceCloud: ['GCP'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as WorkspaceAsset).workspaceId).toBe(2)
  })

  it('returns only workspaces matching the access filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { workspaceId: 1, access: 'open' },
        { workspaceId: 2, access: 'restricted' },
      ]),
    ])

    const result = workspaceAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      workspaceAccess: ['open'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as WorkspaceAsset).workspaceId).toBe(1)
  })
})

describe('workspaceAsset — getRowId', () => {
  it('returns the workspaceId of the row', () => {
    const row: WorkspaceAsset = {
      workspaceId: 123,
      studyId: 1,
      studyName: '',
      name: '',
      platform: '',
      url: '',
      description: '',
    }
    expect(workspaceAsset.getRowId(row)).toBe(123)
  })
})

describe('workspaceAsset — isRowSelectable', () => {
  it('always returns false — workspaces do not participate in access requests', () => {
    const row: WorkspaceAsset = {
      workspaceId: 1,
      studyId: 1,
      studyName: '',
      name: '',
      platform: '',
      url: '',
      description: '',
    }
    expect(workspaceAsset.isRowSelectable(row)).toBe(false)
  })
})

describe('workspaceAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: WorkspaceAsset = {
      workspaceId: 1,
      studyId: 1,
      studyName: '',
      name: '',
      platform: '',
      url: '',
      description: '',
    }
    const result = workspaceAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).toBe(0)
  })
})

describe('workspaceAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = workspaceAsset.selectionToDatasetIds([], ['w1', 'w2'])
    expect(result).toEqual([])
  })
})

describe('workspaceAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: WorkspaceAsset = {
      workspaceId: 1,
      studyId: 42,
      studyName: '',
      name: '',
      platform: '',
      url: '',
      description: '',
    }
    const result = workspaceAsset.getStudyIdsForSelection([row], [1])
    expect(result).toEqual([])
  })
})

describe('workspaceAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = workspaceAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = workspaceAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('name')
    expect(fields).toContain('studyName')
    expect(fields).toContain('platform')
    expect(fields).toContain('url')
    expect(fields).toContain('description')
    expect(fields).toContain('tools')
    expect(fields).toContain('access')
    expect(fields).toContain('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = workspaceAsset.makeColumns()
    const b = workspaceAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})

describe('workspaceAsset — indexed values are normalized', () => {
  it('matches a row whose indexed access carries stray whitespace', () => {
    const response = makeResponse([makeBucket(1, [{ workspaceId: 1, access: '  open ' }])])

    // The option list is built from trimmed values, so the row has to be
    // trimmed too or the filter that offered 'open' drops the only row.
    const result = workspaceAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, workspaceAccess: ['open'] })

    expect(result.items).toHaveLength(1)
  })

  it('trims list-shaped values and drops the empties', () => {
    const response = makeResponse([makeBucket(1, [{ workspaceId: 1, cloud: ['  AWS ', '  ', 'GCP'] }])])

    const result = workspaceAsset.transformResponse(response, pagination)

    expect((result.items[0] as WorkspaceAsset).cloud).toEqual(['AWS', 'GCP'])
  })
})
