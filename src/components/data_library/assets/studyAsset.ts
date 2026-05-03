import { GridColDef } from '@mui/x-data-grid'
import { ElasticsearchQuery, ElasticsearchResponse, QueryClause, StudyAggregationResponse } from 'src/types/elastic'
import { PaginationState, SortState, StudyAggregation } from 'src/types/library'
import { makeStudyColumns } from 'src/components/data_library/columns/studyColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'

export const studyAsset: AssetDefinition = {
  label: { singular: 'Study', plural: 'Studies' },
  sortingMode: 'client',
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
    'study.data.tags',
    'study.phenotype',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    pagination: PaginationState,
    _sort?: SortState,
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
        studies: {
          composite: {
            size: (pagination.page + 1) * pagination.pageSize,
            sources: [
              {
                study_id: {
                  terms: { field: 'study.studyId' },
                },
              },
            ],
          },
          aggs: {
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
          },
        },
        access_management: { terms: { field: 'accessManagement.keyword' } },
        data_use: { terms: { field: 'dataUse.primary.code.keyword' } },
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
        studyId: bucket.key.study_id,
        studyName: studyData.studyName || '',
        studyDescription: studyData.description || '',
        piName: studyData.piName || '',
        species: studyData.species || '',
        phenotype: studyData.phenotype || '',
        dataCustodianEmail: studyData.dataCustodianEmail || [],
        datasetCount: bucket.dataset_count?.value || 0,
        totalParticipants: bucket.total_participants?.value || 0,
        datasetIds: bucket.dataset_ids?.buckets?.map(b => b.key) || [],
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

  computeRowSelection(data: LibraryRow[], selectedDatasetIds: number[]): Set<string | number> {
    const selectedStudyIds = data
      .filter((study) => {
        const studyDatasetIds = (study as StudyAggregation).datasetIds || []
        return studyDatasetIds.some(id => selectedDatasetIds.includes(id))
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

  makeColumns(props?: ColumnsProps): GridColDef[] {
    return makeStudyColumns() as GridColDef[]
  },
}
