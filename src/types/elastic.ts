import { BiospecimenAsset, ModelAsset, SortOrder } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'

export interface MatchQuery {
  match: {
    [field: string]: string | number | boolean
  }
}

export interface ExistsQuery {
  exists: {
    field: string
  }
}

export interface TermQuery {
  term: {
    [field: string]: string | number | boolean
  }
}

export interface MatchPhraseQuery {
  match_phrase: {
    [field: string]: string | number
  }
}

export interface MultiMatchQuery {
  multi_match: {
    query: string
    type?: string
    fields: string[]
  }
}

export interface RangeQuery {
  range: {
    [field: string]: {
      gte?: number
      lte?: number
      gt?: number
      lt?: number
    }
  }
}

export interface BoolQuery {
  bool: {
    must?: QueryClause[]
    should?: QueryClause[]
    must_not?: QueryClause[]
    filter?: QueryClause[]
  }
}

export type QueryClause
  = MatchQuery
    | ExistsQuery
    | TermQuery
    | MatchPhraseQuery
    | MultiMatchQuery
    | RangeQuery
    | BoolQuery

export interface ElasticsearchQuery {
  from?: number
  size?: number
  query?: {
    bool: {
      must?: QueryClause[]
      should?: QueryClause[]
      must_not?: QueryClause[]
      filter?: QueryClause[]
    }
  }
  sort?: Array<{
    [field: string]: {
      order: SortOrder
    }
  }>
  aggs?: {
    [key: string]: AggregationDefinition
  }
}

export interface TermsAggregation {
  terms: {
    field: string
    size?: number
  }
}

export interface CompositeAggregation {
  composite: {
    size: number
    sources: Array<{
      [key: string]: {
        terms: {
          field: string
        }
      }
    }>
    after?: {
      [key: string]: string | number
    }
  }
  aggs?: {
    [key: string]: AggregationDefinition
  }
}

export interface TopHitsAggregation {
  top_hits: {
    size: number
    _source?: string[]
  }
}

export interface ValueCountAggregation {
  value_count: {
    field: string
  }
}

export interface SumAggregation {
  sum: {
    field: string
  }
}

export interface CardinalityAggregation {
  cardinality: {
    field: string
  }
}

export type AggregationDefinition
  = TermsAggregation
    | CompositeAggregation
    | TopHitsAggregation
    | ValueCountAggregation
    | SumAggregation
    | CardinalityAggregation

export interface AggregationBucket {
  key: string | number | { [key: string]: string | number }
  doc_count: number
  [key: string]: unknown
}

export interface AggregationResult {
  buckets?: AggregationBucket[]
  value?: number
  after_key?: {
    [key: string]: string | number
  }
  [key: string]: unknown
}

export interface StudyAggregationBucket {
  key: { study_id: number }
  doc_count: number
  study_details?: {
    hits?: {
      hits?: Array<{
        _source?: {
          study?: {
            studyId?: number
            studyName?: string
            description?: string
            piName?: string
            species?: string
            phenotype?: string
            dataCustodianEmail?: string[]
          }
        }
      }>
    }
  }
  dataset_count?: {
    value: number
  }
  total_participants?: {
    value: number
  }
  dataset_ids?: {
    buckets: Array<{ key: number }>
  }
}

export interface StudyAggregationResponse {
  buckets: StudyAggregationBucket[]
  after_key?: { study_id: number }
}

/** Raw Elasticsearch document shape for a model asset; derived from ModelAsset so both stay in sync. */
export type PartialModelAsset = Partial<ModelAsset>

/** Bucket shape from a terms aggregation on study.studyId, used for the Models view */
export interface ModelStudyAggregationBucket {
  key: number
  doc_count: number
  study_details?: {
    hits?: {
      hits?: Array<{
        _source?: {
          study?: {
            studyId?: number
            studyName?: string
            description?: string
            piName?: string
            assets?: {
              models?: PartialModelAsset[]
            }
          }
        }
      }>
    }
  }
}

export interface ModelStudyAggregationResponse {
  buckets: ModelStudyAggregationBucket[]
}

/** Raw Elasticsearch document shape for a biospecimen asset */
export type PartialBiospecimenAsset = Partial<BiospecimenAsset>

/** Bucket shape from a terms aggregation on study.studyId, used for the Biospecimens view */
export interface BiospecimenStudyAggregationBucket {
  key: number
  doc_count: number
  study_details?: {
    hits?: {
      hits?: Array<{
        _source?: {
          study?: {
            studyId?: number
            studyName?: string
            assets?: {
              biospecimens?: PartialBiospecimenAsset[]
            }
          }
        }
      }>
    }
  }
}

export interface BiospecimenStudyAggregationResponse {
  buckets: BiospecimenStudyAggregationBucket[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  aggregations?: {
    [key: string]: AggregationResult
  }
}

export interface ElasticsearchResponse {
  items: DatasetTerm[]
  total: number
  aggregations?: {
    [key: string]: AggregationResult
  }
}
