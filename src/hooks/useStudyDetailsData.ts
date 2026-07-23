import { useQuery } from '@tanstack/react-query'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { DataSet } from 'src/libs/ajax/DataSet'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { chain, intersection } from 'src/utils/NodashUtil'
import { AggregationResult, ElasticsearchQuery } from 'src/types/elastic'
import { ExportableDatasets, PaginationState, SortState } from 'src/types/library'
import { DatasetTerm, StudyTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

export const STUDY_DATASETS_QUERY_KEY = 'study-details-datasets'
export const STUDY_EXPORTS_QUERY_KEY = 'study-details-exports'

const EMPTY_EXPORTABLE_DATASETS: ExportableDatasets = {}

interface StudyDetailsPage {
  items: DatasetTerm[]
  total: number
  study?: StudyTerm
  participantCount?: number
}

interface StudyDetailsAggregation {
  hits?: {
    hits?: Array<{
      _source?: {
        study?: StudyTerm
      }
    }>
  }
}

export const buildStudyDatasetsQuery = (
  studyId: string,
  pagination: PaginationState,
  sort?: SortState,
): ElasticsearchQuery => {
  const query = datasetAsset.buildQuery(
    [
      { exists: { field: 'study' } },
      { match: { 'study.studyId': studyId } },
    ],
    [],
    pagination,
    sort,
    // Preserve the study page's existing behavior of showing all controlled
    // datasets, including those still awaiting DAC approval.
    { showAllControlled: true },
  )

  return {
    ...query,
    aggs: {
      ...query.aggs,
      study_details: {
        top_hits: {
          size: 1,
          _source: ['study.*'],
        },
      },
      total_participants: {
        sum: { field: 'participantCount' },
      },
    },
  }
}

export const useStudyDatasets = (
  studyId: string,
  pagination: PaginationState,
  sort?: SortState,
) => useQuery({
  queryKey: [STUDY_DATASETS_QUERY_KEY, studyId, pagination, sort],
  enabled: studyId.length > 0,
  queryFn: async (): Promise<StudyDetailsPage> => {
    const response = await DataSet.searchDatasetIndexV2(
      buildStudyDatasetsQuery(studyId, pagination, sort),
    )
    const page = datasetAsset.transformResponse(response, pagination)
    const studyAggregation = response.aggregations?.study_details as StudyDetailsAggregation | undefined
    const participantAggregation = response.aggregations?.total_participants as AggregationResult | undefined
    const items = page.items as DatasetTerm[]

    return {
      items,
      total: page.total,
      study: studyAggregation?.hits?.hits?.[0]?._source?.study ?? items[0]?.study,
      participantCount: participantAggregation?.value,
    }
  },
  staleTime: 5 * 60 * 1000,
})

export const useStudyExportableDatasets = (
  studyId: string,
  datasets: DatasetTerm[],
) => {
  const datasetIdentifiers = datasets.map(dataset => dataset.datasetIdentifier)

  return useQuery({
    queryKey: [STUDY_EXPORTS_QUERY_KEY, studyId, datasetIdentifiers],
    enabled: datasetIdentifiers.length > 0,
    queryFn: async (): Promise<ExportableDatasets> => {
      try {
        const snapshots = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers) as EnumerateSnapshotModel
        if (snapshots.filteredTotal === 0) return EMPTY_EXPORTABLE_DATASETS

        return chain(snapshots.items)
          .filter((snapshot: SnapshotSummaryModel) =>
            intersection(snapshots.roleMap?.[snapshot.id] ?? [], ['steward', 'reader']).length > 0)
          .groupBy('duosId')
          .value()
      }
      catch {
        return EMPTY_EXPORTABLE_DATASETS
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
