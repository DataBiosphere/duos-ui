/**
 * Unit tests for modelAsset — the AI Models AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { modelAsset } from 'src/components/data_library/assets/modelAsset'
import { ModelAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  ModelStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  models: Array<{
    modelId?: string
    name?: string
    format?: string
    license?: string
    cloud?: string[]
    tags?: string[]
    url?: string
    maintainer?: { name: string, email: string }
  }> = [],
  studyName = 'Test Study',
): ModelStudyAggregationBucket => ({
  key: studyId,
  doc_count: models.length,
  study_details: {
    hits: {
      hits: [
        {
          _source: {
            study: {
              studyId,
              studyName,
              assets: {
                models: models.map(m => ({
                  modelId: m.modelId,
                  name: m.name,
                  format: m.format,
                  license: m.license,
                  cloud: m.cloud,
                  tags: m.tags,
                  url: m.url,
                  maintainer: m.maintainer,
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
  buckets: ModelStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // oxlint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

describe('modelAsset — label', () => {
  it('has singular "AI Model" and plural "AI Models"', () => {
    expect(modelAsset.label.singular).toBe('AI Model')
    expect(modelAsset.label.plural).toBe('AI Models')
  })
})

describe('modelAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(modelAsset.sortingMode).toBe('client')
  })
})

describe('modelAsset — searchFields', () => {
  it('includes model-specific fields', () => {
    expect(modelAsset.searchFields).toContain('study.assets.models.name')
    expect(modelAsset.searchFields).toContain('study.assets.models.format')
    expect(modelAsset.searchFields).toContain('study.assets.models.license')
    expect(modelAsset.searchFields).toContain('study.assets.models.tags')
  })

  it('includes study-level fields', () => {
    expect(modelAsset.searchFields).toContain('study.studyName')
    expect(modelAsset.searchFields).toContain('study.piName')
  })
})

describe('modelAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).toBe(0)
    expect(q.from).toBe(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).toHaveProperty('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).toBe('study.studyId')
    expect(studiesAgg.terms.size).toBe(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).toHaveLength(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).toBe('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).toBe(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = modelAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).toHaveLength(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'name', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = modelAsset.buildQuery([existsClause], [], largePagination, sort)
    expect(q.size).toBe(0)
    expect(q.sort).toBe(undefined)
  })
})

describe('modelAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = modelAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('flattens models from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ modelId: 'm1', name: 'Alpha' }, { modelId: 'm2', name: 'Beta' }]),
      makeBucket(2, [{ modelId: 'm3', name: 'Gamma' }]),
    ])
    const result = modelAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to ModelAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        modelId: 'model-xyz',
        name: 'ResNet',
        format: 'ONNX',
        license: 'Apache-2.0',
        tags: ['vision', 'classification'],
        url: 'https://example.com',
        maintainer: { name: 'Alice', email: 'alice@example.com' },
      }], 'NHGRI Study'),
    ])
    const result = modelAsset.transformResponse(response, pagination)
    const row = result.items[0] as ModelAsset
    expect(row.modelId).toBe('model-xyz')
    expect(row.studyId).toBe(42)
    expect(row.studyName).toBe('NHGRI Study')
    expect(row.name).toBe('ResNet')
    expect(row.format).toBe('ONNX')
    expect(row.license).toBe('Apache-2.0')
    expect(row.url).toBe('https://example.com')
    expect(row.tags).toEqual(['vision', 'classification'])
    expect(row.maintainer.name).toBe('Alice')
    expect(row.maintainer.email).toBe('alice@example.com')
  })

  it('falls back to composite key when modelId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ name: 'NoId Model' }]),
    ])
    const result = modelAsset.transformResponse(response, pagination)
    const row = result.items[0] as ModelAsset
    expect(row.modelId).toBe('99-0')
  })

  it('applies client-side pagination', () => {
    const models = Array.from({ length: 30 }, (_, i) => ({
      modelId: `m${i}`,
      name: `Model ${i}`,
    }))
    const response = makeResponse([makeBucket(1, models)])

    const page0 = modelAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).toHaveLength(10)
    expect((page0.items[0] as ModelAsset).name).toBe('Model 0')

    const page1 = modelAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).toHaveLength(10)
    expect((page1.items[0] as ModelAsset).name).toBe('Model 10')

    const page2 = modelAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).toHaveLength(10)
    expect((page2.items[0] as ModelAsset).name).toBe('Model 20')
  })

  it('reports total as the number of all models across all studies (not just page)', () => {
    const models = Array.from({ length: 30 }, (_, i) => ({ modelId: `m${i}` }))
    const response = makeResponse([makeBucket(1, models)])
    const result = modelAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty tags / maintainer defaults for missing fields', () => {
    const response = makeResponse([
      makeBucket(1, [{}]),
    ])
    const row = modelAsset.transformResponse(response, pagination).items[0] as ModelAsset
    expect(row.tags).toEqual([])
    expect(row.maintainer.name).toBe('')
    expect(row.maintainer.email).toBe('')
    expect(row.name).toBe('')
    expect(row.format).toBe('')
  })

  it('handles a study bucket with no models gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = modelAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('maps the cloud field onto the row', () => {
    const response = makeResponse([makeBucket(1, [{ modelId: 'm1', cloud: ['AWS', 'GCP'] }])])
    const row = modelAsset.transformResponse(response, pagination).items[0] as ModelAsset
    expect(row.cloud).toEqual(['AWS', 'GCP'])
  })

  // The ES clauses for these filters only decide which studies are aggregated;
  // every model of a qualifying study comes back, so transformResponse must
  // re-check each row or the grid and count badge include non-matching rows.
  it('returns only models matching the format filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 'm1', format: 'ONNX' },
        { modelId: 'm2', format: 'PyTorch' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelFormat: ['ONNX'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe('m1')
  })

  it('returns only models matching the license filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 'm1', license: 'Apache-2.0' },
        { modelId: 'm2', license: 'MIT' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelLicense: ['MIT'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe('m2')
  })

  it('returns only models matching the cloud filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 'm1', cloud: ['AWS'] },
        { modelId: 'm2', cloud: ['GCP'] },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelCloud: ['GCP'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe('m2')
  })

  it('returns only models matching the tags filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 'm1', tags: ['vision'] },
        { modelId: 'm2', tags: ['nlp'] },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelTags: ['nlp'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe('m2')
  })

  it('combines multiple active model filters with AND', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 'm1', format: 'ONNX', license: 'MIT' },
        { modelId: 'm2', format: 'ONNX', license: 'Apache-2.0' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      modelFormat: ['ONNX'],
      modelLicense: ['Apache-2.0'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe('m2')
  })
})

describe('modelAsset — getRowId', () => {
  it('returns the modelId of the row', () => {
    const row: ModelAsset = {
      modelId: 'abc-123',
      studyId: 1,
      studyName: '',
      name: '',
      description: '',
      url: '',
      format: '',
      license: '',
      trainedOnDatasets: [],
      maintainer: { name: '', email: '' },
    }
    expect(modelAsset.getRowId(row)).toBe('abc-123')
  })
})

describe('modelAsset — isRowSelectable', () => {
  it('always returns false — models do not participate in access requests', () => {
    const row: ModelAsset = {
      modelId: 'm1',
      studyId: 1,
      studyName: '',
      name: '',
      description: '',
      url: '',
      format: '',
      license: '',
      trainedOnDatasets: [],
      maintainer: { name: '', email: '' },
    }
    expect(modelAsset.isRowSelectable(row)).toBe(false)
  })
})

describe('modelAsset — computeRowSelection', () => {
  it('always returns an empty Set regardless of inputs', () => {
    const row: ModelAsset = {
      modelId: 'm1',
      studyId: 1,
      studyName: '',
      name: '',
      description: '',
      url: '',
      format: '',
      license: '',
      trainedOnDatasets: [],
      maintainer: { name: '', email: '' },
    }
    const result = modelAsset.computeRowSelection([row], [1, 2, 3])
    expect(result.size).toBe(0)
  })
})

describe('modelAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = modelAsset.selectionToDatasetIds([], ['m1', 'm2'])
    expect(result).toEqual([])
  })
})

describe('modelAsset — getStudyIdsForSelection', () => {
  it('always returns an empty array', () => {
    const row: ModelAsset = {
      modelId: 'm1',
      studyId: 42,
      studyName: '',
      name: '',
      description: '',
      url: '',
      format: '',
      license: '',
      trainedOnDatasets: [],
      maintainer: { name: '', email: '' },
    }
    const result = modelAsset.getStudyIdsForSelection([row], [1])
    expect(result).toEqual([])
  })
})

describe('modelAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = modelAsset.makeColumns()
    expect(Array.isArray(cols)).toBe(true)
    expect(cols.length).toBeGreaterThan(0)
  })

  it('includes required field names', () => {
    const cols = modelAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).toContain('name')
    expect(fields).toContain('studyName')
    expect(fields).toContain('format')
    expect(fields).toContain('license')
    expect(fields).toContain('cloud')
    expect(fields).toContain('maintainer')
    expect(fields).toContain('url')
    expect(fields).toContain('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = modelAsset.makeColumns()
    const b = modelAsset.makeColumns({})
    expect(a.map(c => c.field)).toEqual(b.map(c => c.field))
  })
})
