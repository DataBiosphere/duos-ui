import { GridColDef } from '@mui/x-data-grid'
import { AggregationDefinition, CompositeAggregation, ElasticsearchQuery, ElasticsearchResponse, QueryClause, StudyAggregationResponse, studyIdFromBucketKey } from 'src/types/elastic'
import { PaginationState, SortState, StudyAggregation } from 'src/types/library'
import { makeStudyColumns } from 'src/components/data_library/columns/studyColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'
import { StudyDataEsFields } from 'src/libs/data-metadata'

/**
 * Neither aggregation shape has an offset, so page N costs (N + 1) * pageSize buckets. Sized as
 * a safety rail well above the ~4.1k corpus, matching the `STUDIES_AGG` every other tab fetches.
 */
export const MAX_STUDY_BUCKETS = 10000

/** Sorts a composite cannot serve: it orders only by its sources, never by a computed metric. */
const METRIC_SORT_AGGS: Record<string, string> = {
  totalParticipants: 'total_participants',
  datasetCount: 'dataset_count',
}

/** Per-study metrics, identical whichever aggregation shape carries them. */
const STUDY_BUCKET_AGGS: Record<string, AggregationDefinition> = {
  study_details: {
    top_hits: { size: 1, _source: ['study.*'] },
  },
  dataset_count: {
    value_count: { field: 'datasetId' },
  },
  total_participants: {
    sum: { field: 'participantCount' },
  },
  dataset_ids: {
    terms: { field: 'datasetId', size: 10000 },
  },
  data_use_codes: {
    terms: { field: 'dataUse.primary.code.keyword', size: 10 },
  },
  access_management_types: {
    terms: { field: 'accessManagement.keyword', size: 10 },
  },
}

/**
 * Both shapes return buckets already ordered, so `transformResponse` only slices. Metric ordering
 * is approximate across shards — `terms` ranks each shard's own top buckets before merging.
 */
const buildStudiesAgg = (pagination: PaginationState, sort?: SortState): AggregationDefinition => {
  const size = Math.min((pagination.page + 1) * pagination.pageSize, MAX_STUDY_BUCKETS)
  const metricAgg = sort ? METRIC_SORT_AGGS[sort.field] : undefined

  if (sort && metricAgg) {
    return {
      // shard_size lifts each shard's candidate list to the whole corpus, so a globally top
      // study cannot be dropped before the merge — exact while the corpus sits under the cap.
      terms: { field: 'study.studyId', size, shard_size: MAX_STUDY_BUCKETS, order: { [metricAgg]: sort.order } },
      aggs: STUDY_BUCKET_AGGS,
    }
  }

  // Trailing study id keeps the key unique; same-named studies would otherwise share a bucket.
  const sources: CompositeAggregation['composite']['sources'] = sort?.field === 'studyName'
    ? [
        { study_name: { terms: { field: 'study.studyName.keyword', order: sort.order } } },
        { study_id: { terms: { field: 'study.studyId' } } },
      ]
    : [{ study_id: { terms: { field: 'study.studyId' } } }]

  return {
    composite: { size, sources },
    aggs: STUDY_BUCKET_AGGS,
  }
}

export const studyAsset: AssetDefinition = {
  label: { singular: 'Study', plural: 'Studies' },
  sortingMode: 'server',
  searchFields: [
    'datasetName',
    'dataLocation',
    'study.description',
    'study.studyName',
    'study.species',
    'study.piName',
    'study.dataCustodianEmail',
    'study.dataTypes',
    'dataUse.primary.code',
    'dataUse.secondary.code',
    'dac.dacName',
    'datasetIdentifier',
    StudyDataEsFields.TAGS,
    'study.phenotype',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    pagination: PaginationState,
    sort?: SortState,
  ): ElasticsearchQuery {
    return {
      size: 0,
      query: {
        bool: {
          must: queryChunks,
          ...(filterQuery.length > 0 && { filter: filterQuery }),
        },
      },
      aggs: {
        total_studies: {
          cardinality: { field: 'study.studyId' },
        },
        studies: buildStudiesAgg(pagination, sort),
        access_management: { terms: { field: 'accessManagement.keyword' } },
        data_use: { terms: { field: 'dataUse.primary.code.keyword' } },
        // Explicit `size`: the secondary vocabulary exceeds the default bucket limit of 10.
        data_use_modifiers: { terms: { field: 'dataUse.secondary.code.keyword', size: 50 } },
        data_type: { terms: { field: 'study.dataTypes.keyword' } },
        dac: { terms: { field: 'dac.dacName.keyword' } },
      },
    }
  },

  transformResponse(response: ElasticsearchResponse, pagination: PaginationState): LibraryPage {
    const studiesAgg = response.aggregations?.studies as StudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []

    const allStudies: StudyAggregation[] = buckets.map((bucket) => {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      return {
        studyId: studyIdFromBucketKey(bucket.key),
        studyName: studyData.studyName || '',
        studyDescription: studyData.description || '',
        piName: studyData.piName || '',
        species: studyData.species || '',
        phenotype: studyData.phenotype || '',
        dataCustodianEmail: studyData.dataCustodianEmail || [],
        dataTypes: studyData.dataTypes || [],
        dataUseCodes: bucket.data_use_codes?.buckets?.map(b => b.key) || [],
        accessTypes: bucket.access_management_types?.buckets?.map(b => b.key) || [],
        datasetCount: bucket.dataset_count?.value || 0,
        totalParticipants: bucket.total_participants?.value || 0,
        datasetIds: bucket.dataset_ids?.buckets?.map(b => b.key) || [],
        modelCount: studyData.assets?.models?.length || 0,
        workspaceCount: studyData.assets?.workspaces?.length || 0,
      }
    })

    const totalResult = response.aggregations?.total_studies as { value: number } | undefined
    const total = totalResult?.value || allStudies.length
    const start = pagination.page * pagination.pageSize
    return {
      items: allStudies.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as StudyAggregation).studyId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    return true
  },

  // Every, not some: a study whose datasets are only part-selected must not render as fully
  // checked, or acting on that checkbox would silently select the datasets the user left out.
  computeRowSelection(data: LibraryRow[], selectedDatasetIds: number[]): Set<string | number> {
    const selectedStudyIds = data
      .filter((study) => {
        const studyDatasetIds = (study as StudyAggregation).datasetIds || []
        return studyDatasetIds.length > 0 && studyDatasetIds.every(id => selectedDatasetIds.includes(id))
      })
      .map(study => (study as StudyAggregation).studyId)
    return new Set(selectedStudyIds)
  },

  selectionToDatasetIds(data: LibraryRow[], selectedRowIds: (string | number)[]): number[] {
    const datasetIds: number[] = []
    data.forEach((study) => {
      if (selectedRowIds.includes((study as StudyAggregation).studyId)) {
        datasetIds.push(...((study as StudyAggregation).datasetIds || []))
      }
    })
    return datasetIds
  },

  getStudyIdsForSelection(data: LibraryRow[], selectedDatasetIds: number[]): number[] {
    return data
      .filter((study) => {
        const studyDatasetIds = (study as StudyAggregation).datasetIds || []
        return studyDatasetIds.some(id => selectedDatasetIds.includes(id))
      })
      .map(study => (study as StudyAggregation).studyId)
  },

  makeColumns(_props?: ColumnsProps): GridColDef[] {
    return makeStudyColumns() as GridColDef[]
  },
}
