import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { datasetAsset } from 'src/components/data_library/assets/datasetAsset'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetMetrics } from 'src/libs/ajax/DatasetMetrics'
import { Study } from 'src/libs/ajax/Study'
import { StudyComments } from 'src/libs/ajax/StudyComments'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { chain, intersection } from 'src/utils/NodashUtil'
import { AggregationResult, ElasticsearchQuery } from 'src/types/elastic'
import { ExportableDatasets, PaginationState, SortState } from 'src/types/library'
import { DatasetTerm, StudyTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'

const STUDY_ASSETS_QUERY_KEY = 'study-assets'
const STUDY_STALE_TIME = 5 * 60 * 1000

// The page's primary `study` object comes from the Elasticsearch-backed search index, which
// cannot supply metadata when a study has no datasets and doesn't carry PI institution/external
// profile fields. Fetch those from the relational store.
export const usePiDetails = (studyId: string) => useQuery({
  queryKey: [STUDY_ASSETS_QUERY_KEY, 'pi-details', studyId],
  enabled: studyId.length > 0,
  queryFn: () => Study.getById(studyId),
  staleTime: STUDY_STALE_TIME,
})

/**
 * Every page of one study's comments. The offset is deliberately absent: posting invalidates this
 * prefix, so a revision refreshes whichever pages the reader has open rather than only the first.
 */
export const studyCommentsQueryKey = (studyId: string) => [STUDY_ASSETS_QUERY_KEY, 'comments', studyId]

/**
 * A study's comments, a page at a time.
 *
 * The endpoint is paged and its page size is capped, so 'show more' has to fetch the next page
 * and append rather than ask for a bigger one. Every page repeats the study-wide `averageRating`,
 * `total` and `yourComment`, so the first page is enough to read those from.
 */
export const useStudyComments = (studyId: string) => useInfiniteQuery({
  queryKey: studyCommentsQueryKey(studyId),
  enabled: studyId.length > 0,
  initialPageParam: 0,
  queryFn: ({ pageParam }) => StudyComments.listComments(studyId, pageParam),
  getNextPageParam: (lastPage, allPages) => {
    const loaded = allPages.reduce((count, page) => count + page.comments.length, 0)
    // A page shorter than requested also means the end, so a comment deleted mid-paging cannot
    // leave this asking for an offset past the list forever.
    return loaded < lastPage.total && lastPage.comments.length > 0 ? loaded : undefined
  },
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
    // Asks for the study's datasets in one request. Elasticsearch refuses a `size` beyond
    // index.max_result_window (10,000 by default), so this is bounded by how large a study can
    // get: the largest in production holds 67 datasets, three orders of magnitude below the
    // limit. If a study ever did exceed it the request fails rather than truncating, and the
    // caller falls back to selecting the visible page - degraded, not silently wrong. Paging or
    // a bulk-id endpoint is the fix if studies ever approach that size.
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
