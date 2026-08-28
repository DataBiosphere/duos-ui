/**
 * Unit tests for studyAsset — the Studies AssetDefinition.
 */
import { describe, it, expect } from 'vitest'
import { MAX_STUDY_BUCKETS, studyAsset } from 'src/components/data_library/assets/studyAsset'
import { PaginationState, SortState } from 'src/types/library'
import { CompositeAggregation, QueryClause, TermsAggregation } from 'src/types/elastic'

const buildStudiesAgg = (pagination: PaginationState, sort?: SortState) => {
  const query = studyAsset.buildQuery([] as QueryClause[], [] as QueryClause[], pagination, sort)
  return query.aggs!.studies
}

const pagination: PaginationState = { page: 0, pageSize: 25 }

describe('studyAsset.buildQuery', () => {
  describe('bucket depth', () => {
    it('asks only for the buckets the page needs', () => {
      expect((buildStudiesAgg(pagination) as CompositeAggregation).composite.size).toBe(25)
      expect((buildStudiesAgg({ page: 3, pageSize: 25 }) as CompositeAggregation).composite.size).toBe(100)
    })

    // Neither aggregation supports an offset, so bucket count grows with depth. Without the cap
    // one click on a far page would pull every earlier bucket with its dataset_ids list.
    it('caps the bucket count however deep the page is', () => {
      expect((buildStudiesAgg({ page: 9999, pageSize: 100 }) as CompositeAggregation).composite.size)
        .toBe(MAX_STUDY_BUCKETS)
    })
  })

  describe('sorting', () => {
    // Without it each shard ranks only its own candidates, so a globally top study can be dropped.
    it('raises shard_size so a metric ranking is exact below the cap', () => {
      const agg = buildStudiesAgg(pagination, { field: 'datasetCount', order: 'desc' }) as TermsAggregation
      expect(agg.terms.shard_size).toBe(MAX_STUDY_BUCKETS)
    })

    it('orders by study id when no sort is requested', () => {
      const agg = buildStudiesAgg(pagination) as CompositeAggregation
      expect(agg.composite.sources).toEqual([{ study_id: { terms: { field: 'study.studyId' } } }])
    })

    it('orders by name through the composite source, so the sort spans the corpus', () => {
      const agg = buildStudiesAgg(pagination, { field: 'studyName', order: 'desc' }) as CompositeAggregation
      expect(agg.composite.sources[0]).toEqual({
        study_name: { terms: { field: 'study.studyName.keyword', order: 'desc' } },
      })
    })

    // Two studies sharing a name would collapse into one bucket without a unique trailing source.
    it('keeps study id as a tie-break source when ordering by name', () => {
      const agg = buildStudiesAgg(pagination, { field: 'studyName', order: 'asc' }) as CompositeAggregation
      expect(agg.composite.sources[1]).toEqual({ study_id: { terms: { field: 'study.studyId' } } })
    })

    // A composite aggregation can only order by its sources, never by a computed metric.
    it('switches to a terms aggregation to rank by a metric', () => {
      const agg = buildStudiesAgg(pagination, { field: 'totalParticipants', order: 'desc' }) as TermsAggregation
      expect(agg.terms).toEqual({
        field: 'study.studyId',
        size: 25,
        shard_size: MAX_STUDY_BUCKETS,
        order: { total_participants: 'desc' },
      })
    })

    it('ranks by dataset count through the same metric path', () => {
      const agg = buildStudiesAgg(pagination, { field: 'datasetCount', order: 'desc' }) as TermsAggregation
      expect(agg.terms.order).toEqual({ dataset_count: 'desc' })
    })

    it('carries the same per-study metrics whichever shape it picks', () => {
      const composite = buildStudiesAgg(pagination) as CompositeAggregation
      const terms = buildStudiesAgg(pagination, { field: 'totalParticipants', order: 'desc' }) as TermsAggregation
      expect(Object.keys(composite.aggs!)).toEqual(Object.keys(terms.aggs!))
    })
  })
})

describe('studyAsset.transformResponse', () => {
  const bucketMetrics = {
    doc_count: 1,
    study_details: { hits: { hits: [{ _source: { study: { studyName: 'A Study' } } }] } },
    dataset_count: { value: 2 },
    total_participants: { value: 40 },
    dataset_ids: { buckets: [{ key: 10 }, { key: 11 }] },
  }

  it('reads the study id from a composite bucket key', () => {
    const page = studyAsset.transformResponse(
      { aggregations: { studies: { buckets: [{ key: { study_id: 7 }, ...bucketMetrics }] } } } as never,
      pagination,
    )
    expect(page.items[0]).toMatchObject({ studyId: 7, studyName: 'A Study', datasetIds: [10, 11] })
  })

  it('reads the study id from a terms bucket key', () => {
    const page = studyAsset.transformResponse(
      { aggregations: { studies: { buckets: [{ key: 7, ...bucketMetrics }] } } } as never,
      pagination,
    )
    expect(page.items[0]).toMatchObject({ studyId: 7, studyName: 'A Study', datasetIds: [10, 11] })
  })
})
