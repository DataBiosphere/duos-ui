/**
 * Unit tests for modelAsset — the AI Models AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { modelAsset } from 'src/components/data_library/assets/modelAsset'
import { ModelAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  ModelStudyAggregationBucket,
  PartialModelAsset,
  QueryClause,
} from 'src/types/elastic'
import { EMPTY_FILTERS } from 'src/components/data_library/filterRegistry'

const pagination: PaginationState = { page: 0, pageSize: 25 }

const makeBucket = (
  studyId: number,
  models: Array<{
    modelId?: number
    name?: string
    format?: string
    license?: string
    cloud?: string[] | string
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
    // Cloud is a displayed, filterable field, so free-text search must reach it.
    expect(modelAsset.searchFields).toContain('study.assets.models.cloud')
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
      makeBucket(1, [{ modelId: 1, name: 'Alpha' }, { modelId: 2, name: 'Beta' }]),
      makeBucket(2, [{ modelId: 3, name: 'Gamma' }]),
    ])
    const result = modelAsset.transformResponse(response, pagination)
    expect(result.items).toHaveLength(3)
    expect(result.total).toBe(3)
  })

  it('maps fields correctly from bucket to ModelAsset', () => {
    const response = makeResponse([
      makeBucket(42, [{
        modelId: 4201,
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
    expect(row.modelId).toBe(4201)
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

  it('uses the server-assigned row id as the row id', () => {
    const response = makeResponse([makeBucket(99, [{ modelId: 17 }])])
    const row = modelAsset.transformResponse(response, pagination).items[0] as ModelAsset
    expect(row.modelId).toBe(17)
    expect(modelAsset.getRowId(row)).toBe(17)
  })

  it('renders no row for an entry without a row id', () => {
    const response = makeResponse([makeBucket(99, [{ name: 'No Id' }, { modelId: 17 }])])
    const result = modelAsset.transformResponse(response, pagination)
    expect(result.items.map(row => (row as ModelAsset).modelId)).toEqual([17])
    expect(result.total).toBe(1)
  })

  it('renders no row for an indexed element that is not an object', () => {
    const bucket = makeBucket(99, [{ modelId: 17 }])
    const entries = bucket.study_details?.hits?.hits?.[0]?._source?.study?.assets?.models
    entries?.push(...(['legacy', null, 7, [18]] as unknown as PartialModelAsset[]))
    const result = modelAsset.transformResponse(makeResponse([bucket]), pagination)
    expect(result.items.map(row => (row as ModelAsset).modelId)).toEqual([17])
  })

  it('applies client-side pagination', () => {
    const models = Array.from({ length: 30 }, (_, i) => ({
      modelId: i + 1,
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
    const models = Array.from({ length: 30 }, (_, i) => ({ modelId: i + 1 }))
    const response = makeResponse([makeBucket(1, models)])
    const result = modelAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).toBe(30)
  })

  it('returns empty tags / maintainer defaults for missing fields', () => {
    const response = makeResponse([
      makeBucket(1, [{ modelId: 1 }]),
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
    const response = makeResponse([makeBucket(1, [{ modelId: 1, cloud: ['AWS', 'GCP'] }])])
    const row = modelAsset.transformResponse(response, pagination).items[0] as ModelAsset
    expect(row.cloud).toEqual(['AWS', 'GCP'])
  })

  it('normalizes a cloud indexed as a bare string into an array', () => {
    const response = makeResponse([makeBucket(1, [{ modelId: 1, cloud: 'AWS' }])])
    const row = modelAsset.transformResponse(response, pagination).items[0] as ModelAsset
    expect(row.cloud).toEqual(['AWS'])
  })

  it('matches the cloud filter against a cloud indexed as a bare string', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 1, cloud: 'AWS' },
        { modelId: 2, cloud: 'GCP' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelCloud: ['GCP'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe(2)
  })

  // Every model of a qualifying study comes back, so rows need re-checking.
  it('returns only models matching the format filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 1, format: 'ONNX' },
        { modelId: 2, format: 'PyTorch' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelFormat: ['ONNX'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe(1)
  })

  it('returns only models matching the license filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 1, license: 'Apache-2.0' },
        { modelId: 2, license: 'MIT' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelLicense: ['MIT'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe(2)
  })

  it('returns only models matching the cloud filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 1, cloud: ['AWS'] },
        { modelId: 2, cloud: ['GCP'] },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelCloud: ['GCP'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe(2)
  })

  it('returns only models matching the tags filter', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 1, tags: ['vision'] },
        { modelId: 2, tags: ['nlp'] },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelTags: ['nlp'] })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe(2)
  })

  // The four model fields are free text, so the corpus can carry either casing
  // while the analyzed ES clause admits both; the row pass must agree.
  it.each([
    ['modelFormat', 'format'],
    ['modelLicense', 'license'],
  ])('matches %s regardless of the indexed casing', (key, field) => {
    const response = makeResponse([makeBucket(1, [{ modelId: 1, [field]: 'PyTorch' }])])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, [key]: ['pytorch'] })

    expect(result.total).toBe(1)
  })

  it.each([
    ['modelCloud', 'cloud'],
    ['modelTags', 'tags'],
  ])('matches %s regardless of the indexed casing', (key, field) => {
    const response = makeResponse([makeBucket(1, [{ modelId: 1, [field]: ['AWS'] }])])

    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, [key]: ['aws'] })

    expect(result.total).toBe(1)
  })

  it('combines multiple active model filters with AND', () => {
    const response = makeResponse([
      makeBucket(1, [
        { modelId: 1, format: 'ONNX', license: 'MIT' },
        { modelId: 2, format: 'ONNX', license: 'Apache-2.0' },
      ]),
    ])

    const result = modelAsset.transformResponse(response, pagination, {
      ...EMPTY_FILTERS,
      modelFormat: ['ONNX'],
      modelLicense: ['Apache-2.0'],
    })

    expect(result.total).toBe(1)
    expect((result.items[0] as ModelAsset).modelId).toBe(2)
  })
})

describe('modelAsset — getRowId', () => {
  it('returns the modelId of the row', () => {
    const row: ModelAsset = {
      modelId: 123,
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
    expect(modelAsset.getRowId(row)).toBe(123)
  })
})

describe('modelAsset — isRowSelectable', () => {
  it('always returns false — models do not participate in access requests', () => {
    const row: ModelAsset = {
      modelId: 1,
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
      modelId: 1,
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
      modelId: 1,
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

describe('modelAsset — indexed values are normalized', () => {
  it('matches a row whose indexed format carries stray whitespace', () => {
    const response = makeResponse([makeBucket(1, [{ modelId: 1, format: '  ONNX ' }])])

    // The option list is built from trimmed values, so the row has to be
    // trimmed too or the filter that offered 'ONNX' drops the only row.
    const result = modelAsset.transformResponse(response, pagination, { ...EMPTY_FILTERS, modelFormat: ['ONNX'] })

    expect(result.items).toHaveLength(1)
  })

  it('trims list-shaped values and drops the empties', () => {
    const response = makeResponse([makeBucket(1, [{ modelId: 1, cloud: ['  AWS ', '  ', 'GCP'] }])])

    const result = modelAsset.transformResponse(response, pagination)

    expect((result.items[0] as ModelAsset).cloud).toEqual(['AWS', 'GCP'])
  })
})
