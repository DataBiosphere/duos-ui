/**
 * Unit tests for workspaceAsset — the Workspaces AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { workspaceAsset } from 'src/components/data_library/assets/workspaceAsset'
import { WorkspaceAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  WorkspaceStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  workspaces: Array<{
    workspaceId?: string
    name?: string
    platform?: string
    url?: string
    description?: string
    tools?: string[]
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      makeBucket(1, [{ workspaceId: 'w1', name: 'Alpha' }, { workspaceId: 'w2', name: 'Beta' }]),
      makeBucket(2, [{ workspaceId: 'w3', name: 'Gamma' }]),
    ])
    const result = workspaceAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to WorkspaceAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        workspaceId: 'ws-xyz',
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
    expect(row.workspaceId).toBe('ws-xyz')
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

  it('falls back to composite key when workspaceId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ name: 'No-Id Workspace' }]),
    ])
    const result = workspaceAsset.transformResponse(response, pagination)
    const row = result.items[0] as WorkspaceAsset
    expect(row.workspaceId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const workspaces = Array.from({ length: 30 }, (_, i) => ({
      workspaceId: `w${i}`,
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
    const workspaces = Array.from({ length: 30 }, (_, i) => ({ workspaceId: `w${i}` }))
    const response = makeResponse([makeBucket(1, workspaces)])
    const result = workspaceAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty tools / access / tags defaults for missing fields', () => {
    const response = makeResponse([
      makeBucket(1, [{}]),
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
})

describe('workspaceAsset — getRowId', () => {
  it('returns the workspaceId of the row', () => {
    const row: WorkspaceAsset = {
      workspaceId: 'abc-123',
      studyId: 1,
      studyName: '',
      name: '',
      platform: '',
      url: '',
      description: '',
    }
    expect(workspaceAsset.getRowId(row)).toBe('abc-123')
  })
})

describe('workspaceAsset — isRowSelectable', () => {
  it('always returns false — workspaces do not participate in access requests', () => {
    const row: WorkspaceAsset = {
      workspaceId: 'w1',
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
      workspaceId: 'w1',
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
      workspaceId: 'w1',
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
