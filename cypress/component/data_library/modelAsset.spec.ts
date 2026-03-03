/**
 * Unit tests for modelAsset — the AI Models AssetDefinition.
 *
 * These tests are purely logic-level (no DOM mounting) so they run quickly
 * in the Cypress component runner via plain `describe` / `it` blocks.
 */
import { modelAsset } from 'src/components/data_library/assets/modelAsset'
import { ModelAsset, PaginationState, SortState } from 'src/types/library'
import {
  ElasticsearchResponse,
  ModelStudyAggregationBucket,
  QueryClause,
} from 'src/types/elastic'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const pagination: PaginationState = { page: 0, pageSize: 25 }

/** Build a minimal ModelStudyAggregationBucket */
const makeBucket = (
  studyId: number,
  models: Array<{
    modelId?: string
    name?: string
    format?: string
    license?: string
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

/** Wrap buckets in a full ElasticsearchResponse */
const makeResponse = (
  buckets: ModelStudyAggregationBucket[],
): ElasticsearchResponse => ({
  items: [],
  total: 0,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggregations: { studies: { buckets } as any },
})

// ---------------------------------------------------------------------------
// label
// ---------------------------------------------------------------------------

describe('modelAsset — label', () => {
  it('has singular "AI Model" and plural "AI Models"', () => {
    expect(modelAsset.label.singular).to.equal('AI Model')
    expect(modelAsset.label.plural).to.equal('AI Models')
  })
})

// ---------------------------------------------------------------------------
// sortingMode
// ---------------------------------------------------------------------------

describe('modelAsset — sortingMode', () => {
  it('is "client"', () => {
    expect(modelAsset.sortingMode).to.equal('client')
  })
})

// ---------------------------------------------------------------------------
// searchFields
// ---------------------------------------------------------------------------

describe('modelAsset — searchFields', () => {
  it('includes model-specific fields', () => {
    expect(modelAsset.searchFields).to.include('study.assets.models.name')
    expect(modelAsset.searchFields).to.include('study.assets.models.format')
    expect(modelAsset.searchFields).to.include('study.assets.models.license')
    expect(modelAsset.searchFields).to.include('study.assets.models.tags')
  })

  it('includes study-level fields', () => {
    expect(modelAsset.searchFields).to.include('study.studyName')
    expect(modelAsset.searchFields).to.include('study.piName')
  })
})

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe('modelAsset — buildQuery', () => {
  const existsClause: QueryClause = { exists: { field: 'study' } }

  it('returns size: 0 (aggregation-only query)', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.size).to.equal(0)
    expect(q.from).to.equal(undefined)
  })

  it('has a studies terms aggregation on study.studyId', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.aggs).to.have.property('studies')
    const studiesAgg = q.aggs!.studies as {
      terms: { field: string, size: number }
    }
    expect(studiesAgg.terms.field).to.equal('study.studyId')
    expect(studiesAgg.terms.size).to.equal(10000)
  })

  it('includes queryChunks in the must array', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.must).to.have.length(1)
    expect((q.query!.bool.must![0] as { exists: { field: string } }).exists.field).to.equal('study')
  })

  it('omits filter when filterQuery is empty', () => {
    const q = modelAsset.buildQuery([existsClause], [], pagination)
    expect(q.query?.bool.filter).to.equal(undefined)
  })

  it('adds filter when filterQuery has clauses', () => {
    const filterClause: QueryClause = {
      term: { 'accessManagement.keyword': 'controlled' },
    }
    const q = modelAsset.buildQuery([existsClause], [filterClause], pagination)
    expect(q.query?.bool.filter).to.have.length(1)
  })

  it('ignores pagination and sort (all data fetched at once)', () => {
    const sort: SortState = { field: 'name', order: 'asc' }
    const largePagination = { page: 5, pageSize: 100 }
    const q = modelAsset.buildQuery([existsClause], [], largePagination, sort)
    // size should still be 0 — pagination is applied client-side in transformResponse
    expect(q.size).to.equal(0)
    expect(q.sort).to.equal(undefined)
  })
})

// ---------------------------------------------------------------------------
// transformResponse
// ---------------------------------------------------------------------------

describe('modelAsset — transformResponse', () => {
  it('returns empty items for an empty response', () => {
    const result = modelAsset.transformResponse(makeResponse([]), pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })

  it('flattens models from multiple studies into rows', () => {
    const response = makeResponse([
      makeBucket(1, [{ modelId: 'm1', name: 'Alpha' }, { modelId: 'm2', name: 'Beta' }]),
      makeBucket(2, [{ modelId: 'm3', name: 'Gamma' }]),
    ])
    const result = modelAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(3)
    expect(result.total).to.equal(3)
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
    expect(row.modelId).to.equal('model-xyz')
    expect(row.studyId).to.equal(42)
    expect(row.studyName).to.equal('NHGRI Study')
    expect(row.name).to.equal('ResNet')
    expect(row.format).to.equal('ONNX')
    expect(row.license).to.equal('Apache-2.0')
    expect(row.url).to.equal('https://example.com')
    expect(row.tags).to.deep.equal(['vision', 'classification'])
    expect(row.maintainer.name).to.equal('Alice')
    expect(row.maintainer.email).to.equal('alice@example.com')
  })

  it('falls back to composite key when modelId is absent', () => {
    const response = makeResponse([
      makeBucket(99, [{ name: 'NoId Model' }]),
    ])
    const result = modelAsset.transformResponse(response, pagination)
    const row = result.items[0] as ModelAsset
    // composite fallback: `${bucket.key}-${index}`
    expect(row.modelId).to.equal('99-0')
  })

  it('applies client-side pagination', () => {
    const models = Array.from({ length: 30 }, (_, i) => ({
      modelId: `m${i}`,
      name: `Model ${i}`,
    }))
    const response = makeResponse([makeBucket(1, models)])

    const page0 = modelAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(page0.items).to.have.length(10)
    expect((page0.items[0] as ModelAsset).name).to.equal('Model 0')

    const page1 = modelAsset.transformResponse(response, { page: 1, pageSize: 10 })
    expect(page1.items).to.have.length(10)
    expect((page1.items[0] as ModelAsset).name).to.equal('Model 10')

    const page2 = modelAsset.transformResponse(response, { page: 2, pageSize: 10 })
    expect(page2.items).to.have.length(10)
    expect((page2.items[0] as ModelAsset).name).to.equal('Model 20')
  })

  it('reports total as the number of all models across all studies (not just page)', () => {
    const models = Array.from({ length: 30 }, (_, i) => ({ modelId: `m${i}` }))
    const response = makeResponse([makeBucket(1, models)])
    const result = modelAsset.transformResponse(response, { page: 0, pageSize: 10 })
    expect(result.total).to.equal(30)
  })

  it('returns empty tags / maintainer defaults for missing fields', () => {
    const response = makeResponse([
      makeBucket(1, [{}]),
    ])
    const row = modelAsset.transformResponse(response, pagination).items[0] as ModelAsset
    expect(row.tags).to.deep.equal([])
    expect(row.maintainer.name).to.equal('')
    expect(row.maintainer.email).to.equal('')
    expect(row.name).to.equal('')
    expect(row.format).to.equal('')
  })

  it('handles a study bucket with no models gracefully', () => {
    const response = makeResponse([makeBucket(1, [])])
    const result = modelAsset.transformResponse(response, pagination)
    expect(result.items).to.have.length(0)
    expect(result.total).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// getRowId
// ---------------------------------------------------------------------------

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
    expect(modelAsset.getRowId(row)).to.equal('abc-123')
  })
})

// ---------------------------------------------------------------------------
// isRowSelectable
// ---------------------------------------------------------------------------

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
    expect(modelAsset.isRowSelectable(row)).to.equal(false)
  })
})

// ---------------------------------------------------------------------------
// computeRowSelection
// ---------------------------------------------------------------------------

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
    expect(result.size).to.equal(0)
  })
})

// ---------------------------------------------------------------------------
// selectionToDatasetIds
// ---------------------------------------------------------------------------

describe('modelAsset — selectionToDatasetIds', () => {
  it('always returns an empty array', () => {
    const result = modelAsset.selectionToDatasetIds([], ['m1', 'm2'])
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// getStudyIdsForSelection
// ---------------------------------------------------------------------------

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
    expect(result).to.deep.equal([])
  })
})

// ---------------------------------------------------------------------------
// makeColumns
// ---------------------------------------------------------------------------

describe('modelAsset — makeColumns', () => {
  it('returns a non-empty array of column definitions', () => {
    const cols = modelAsset.makeColumns()
    expect(cols).to.be.an('array')
    expect(cols.length).to.be.greaterThan(0)
  })

  it('includes required field names', () => {
    const cols = modelAsset.makeColumns()
    const fields = cols.map(c => c.field)
    expect(fields).to.include('name')
    expect(fields).to.include('studyName')
    expect(fields).to.include('format')
    expect(fields).to.include('license')
    expect(fields).to.include('maintainer')
    expect(fields).to.include('url')
    expect(fields).to.include('tags')
  })

  it('produces the same result when called with or without props', () => {
    const a = modelAsset.makeColumns()
    const b = modelAsset.makeColumns({})
    expect(a.map(c => c.field)).to.deep.equal(b.map(c => c.field))
  })
})
