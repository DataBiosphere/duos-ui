import { useQuery } from '@tanstack/react-query'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { Study } from 'src/libs/ajax/Study'
import { StudyRecommendations } from 'src/libs/ajax/StudyRecommendations'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { chain, intersection } from 'src/utils/NodashUtil'
import { AggregationResult, ElasticsearchQuery } from 'src/types/elastic'
import { ExportableDatasets, PaginationState, SortState } from 'src/types/library'
import { DatasetTerm, StudyTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

const STUDY_ASSETS_QUERY_KEY = 'study-assets'

export const useStudyAssetCounts = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'counts', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getAssetCounts(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyModels = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'models', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getModels(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyWorkspaces = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'workspaces', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getWorkspaces(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyPresentations = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'presentations', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getPresentations(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyClinicalTrials = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'clinicalTrials', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getClinicalTrials(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyIntellectualProperty = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'intellectualProperty', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getIntellectualProperty(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyFundingResources = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'fundingResources', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getFundingResources(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyPastDarRequests = (studyId: string) => useQuery({
  queryKey: ['study-past-dar-requests', studyId],
  enabled: studyId.length > 0,
  queryFn: () => DatasetMetrics.getStudyStats(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useStudyDarTrend = (studyId: string) => useQuery({
  queryKey: ['study-dar-trend', studyId],
  enabled: studyId.length > 0,
  queryFn: () => DatasetMetrics.getDarTrend(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useSimilarStudies = (studyId: string) => useQuery({
  queryKey: ['study-recommendations-similar', studyId],
  enabled: studyId.length > 0,
  queryFn: () => StudyRecommendations.getSimilar(studyId),
  staleTime: 5 * 60 * 1000,
})

export const useFrequentlyRequestedWithStudies = (studyId: string) => useQuery({
  queryKey: ['study-recommendations-frequently-requested-with', studyId],
  enabled: studyId.length > 0,
  queryFn: () => StudyRecommendations.getFrequentlyRequestedWith(studyId),
  staleTime: 5 * 60 * 1000,
})

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
