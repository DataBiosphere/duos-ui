import { GridColDef } from '@mui/x-data-grid'
import {
  ElasticsearchQuery,
  ElasticsearchResponse,
  ClinicalTrialStudyAggregationResponse,
  QueryClause,
} from 'src/types/elastic'
import { ClinicalTrialAsset, PaginationState, SortState } from 'src/types/library'
import { makeClinicalTrialColumns } from 'src/components/data_library/columns/clinicalTrialColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'
import { ClinicalTrialInterventionType, ClinicalTrialPhase, ClinicalTrialStatus } from 'src/types/model'

export const clinicalTrialAsset: AssetDefinition = {
  label: { singular: 'Clinical Trial', plural: 'Clinical Trials' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.clinicalTrials.title',
    'study.assets.clinicalTrials.sponsor',
    'study.assets.clinicalTrials.identifier',
    'study.assets.clinicalTrials.registry',
    'study.assets.clinicalTrials.tags',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested clinical trial assets stored under
    // study.assets.clinicalTrials; client-side pagination is applied in transformResponse.
    return {
      size: 0,
      query: {
        bool: {
          must: queryChunks,
          ...(filterQuery.length > 0 && { filter: filterQuery }),
        },
      },
      aggs: {
        studies: {
          terms: {
            field: 'study.studyId',
            size: 10000,
          },
          aggs: {
            study_details: {
              top_hits: {
                size: 1,
                _source: ['study.*'],
              },
            },
          },
        },
      },
    }
  },

  transformResponse(response: ElasticsearchResponse, pagination: PaginationState): LibraryPage {
    const studiesAgg = response.aggregations?.studies as ClinicalTrialStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const trials: ClinicalTrialAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyTrials = studyData.assets?.clinicalTrials || []
      for (const [trialIndex, trial] of studyTrials.entries()) {
        // clinicalTrialId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        trials.push({
          clinicalTrialId: trial.clinicalTrialId || `${bucket.key}-${trialIndex}`,
          studyId: bucket.key,
          studyName: studyData.studyName || '',
          title: trial.title || '',
          registry: trial.registry || '',
          identifier: trial.identifier || '',
          status: trial.status as ClinicalTrialStatus || '',
          sponsor: trial.sponsor || '',
          startDate: trial.startDate || '',
          endDate: trial.endDate,
          interventionType: trial.interventionType as ClinicalTrialInterventionType || '',
          description: trial.description || '',
          phase: trial.phase as ClinicalTrialPhase || '',
          url: trial.url || '',
          tags: trial.tags || [],
        })
      }
    }

    const total = trials.length
    const start = pagination.page * pagination.pageSize
    return {
      items: trials.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as ClinicalTrialAsset).clinicalTrialId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Clinical trials do not participate in dataset-level access requests
    return false
  },

  computeRowSelection(_data: LibraryRow[], _selectedDatasetIds: number[]): Set<string | number> {
    return new Set()
  },

  selectionToDatasetIds(_data: LibraryRow[], _selectedRowIds: (string | number)[]): number[] {
    return []
  },

  getStudyIdsForSelection(_data: LibraryRow[], _selectedDatasetIds: number[]): number[] {
    return []
  },

  makeColumns(_props?: ColumnsProps): GridColDef[] {
    return makeClinicalTrialColumns() as GridColDef[]
  },
}
