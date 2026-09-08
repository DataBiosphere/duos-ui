import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { Study } from 'src/libs/ajax/Study'
import { StudyComments } from 'src/libs/ajax/StudyComments'
import { StudyRecommendations } from 'src/libs/ajax/StudyRecommendations'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { chain, intersection } from 'src/utils/NodashUtil'
import { AggregationResult, ElasticsearchQuery } from 'src/types/elastic'
import { ExportableDatasets, PaginationState, SortState } from 'src/types/library'
import { DatasetTerm, StudyTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

const STUDY_ASSETS_QUERY_KEY = 'study-assets'
const STUDY_STALE_TIME = 5 * 60 * 1000

const useStudyAsset = <T>(studyId: string, assetType: string, queryFn: () => Promise<T>) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, assetType, studyId],
  enabled: studyId.length > 0,
  queryFn,
  staleTime: STUDY_STALE_TIME,
})

// The page's primary `study` object comes from the Elasticsearch-backed search index, which
// doesn't carry PI institution/external profile fields. Fetch those from the relational store.
export const usePiDetails = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'pi-details', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getById(studyId),
  staleTime: STUDY_STALE_TIME,
})

export const useStudyModels = (studyId: string) =>
  useStudyAsset(studyId, 'models', () => Study.getModels(studyId))

export const useStudyWorkspaces = (studyId: string) =>
  useStudyAsset(studyId, 'workspaces', () => Study.getWorkspaces(studyId))

export const useStudyPresentations = (studyId: string) =>
  useStudyAsset(studyId, 'presentations', () => Study.getPresentations(studyId))

export const useStudyPublications = (studyId: string) =>
  useStudyAsset(studyId, 'publications', () => Study.getPublications(studyId))

export const useStudyClinicalTrials = (studyId: string) =>
  useStudyAsset(studyId, 'clinicalTrials', () => Study.getClinicalTrials(studyId))

export const useStudyIntellectualProperty = (studyId: string) =>
  useStudyAsset(studyId, 'intellectualProperty', () => Study.getIntellectualProperty(studyId))

export const useStudyFundingResources = (studyId: string) =>
  useStudyAsset(studyId, 'fundingResources', () => Study.getFundingResources(studyId))

export const studyCommentsQueryKey = (studyId: string) => [STUDY_ASSETS_QUERY_KEY, 'comments', studyId]

export const useStudyComments = (studyId: string) => useQuery({
  queryKey: studyCommentsQueryKey(studyId),
  enabled: studyId.length > 0,
  queryFn: () => StudyComments.listComments(studyId),
  staleTime: STUDY_STALE_TIME,
})

export const useStudyDarHistory = (studyId: string) => useQuery({
  queryKey: ['study-dar-history', studyId],
  enabled: studyId.length > 0,
  queryFn: () => DatasetMetrics.getStudyStats(studyId),
  staleTime: STUDY_STALE_TIME,
})

export const useStudyResearchOutputs = (studyId: string) => useQuery({
  queryKey: ['study-research-outputs', studyId],
  enabled: studyId.length > 0,
  queryFn: () => DatasetMetrics.getResearchOutputs(studyId),
  staleTime: STUDY_STALE_TIME,
})

export const useSimilarStudies = (studyId: string) => useQuery({
  queryKey: ['study-recommendations-similar', studyId],
  enabled: studyId.length > 0,
  queryFn: () => StudyRecommendations.getSimilar(studyId),
  staleTime: STUDY_STALE_TIME,
})

export const useFrequentlyRequestedWithStudies = (studyId: string) => useQuery({
  queryKey: ['study-recommendations-frequently-requested-with', studyId],
  enabled: studyId.length > 0,
  queryFn: () => StudyRecommendations.getFrequentlyRequestedWith(studyId),
  staleTime: STUDY_STALE_TIME,
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
  // Hold the previous page's rows while the next one loads, so paging and sorting don't
  // collapse the grid to its empty state and back.
  placeholderData: keepPreviousData,
  staleTime: STUDY_STALE_TIME,
})

export const STUDY_SELECTABLE_IDS_QUERY_KEY = 'study-details-selectable-ids'

/**
 * Every selectable dataset id in the study, not just the ones on the visible grid page, so the
 * default selection can't silently apply for a subset. `enabled` is the caller's job: the grid
 * page already covers the whole study whenever `total` fits in one page, which is the common
 * case, so this only costs a request for studies larger than the page size.
 */
export const useStudySelectableDatasetIds = (studyId: string, total: number, enabled: boolean) => useQuery({
  queryKey: [STUDY_SELECTABLE_IDS_QUERY_KEY, studyId, total],
  enabled: enabled && studyId.length > 0 && total > 0,
  queryFn: async (): Promise<number[]> => {
    const pagination = { page: 0, pageSize: total }
    // Same query the grid runs, so the two can't disagree about which datasets belong here.
    const response = await DataSet.searchDatasetIndexV2(buildStudyDatasetsQuery(studyId, pagination))
    const page = datasetAsset.transformResponse(response, pagination)
    return (page.items as DatasetTerm[])
      .filter(dataset => datasetAsset.isRowSelectable(dataset))
      .map(dataset => dataset.datasetId)
  },
  staleTime: STUDY_STALE_TIME,
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
    staleTime: STUDY_STALE_TIME,
  })
}
