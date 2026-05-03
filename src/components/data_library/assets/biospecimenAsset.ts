import { GridColDef } from '@mui/x-data-grid'
import { BiospecimenStudyAggregationResponse, ElasticsearchQuery, ElasticsearchResponse, QueryClause } from 'src/types/elastic'
import { BiospecimenAsset, PaginationState, SortState } from 'src/types/library'
import { makeBiospecimenColumns } from 'src/components/data_library/columns/biospecimenColumns'
import { AssetDefinition, ColumnsProps, LibraryPage, LibraryRow } from 'src/components/data_library/assets/definition'
import { BioSpecimenPreservationMethod, BioSpecimenType, PostMortemIntervalUnit, Sex } from 'src/types/model'

export const biospecimenAsset: AssetDefinition = {
  label: { singular: 'Biospecimen', plural: 'Biospecimens' },
  sortingMode: 'client',
  searchFields: [
    'study.studyName',
    'study.description',
    'study.piName',
    'study.assets.biospecimens.biospecimenId',
    'study.assets.biospecimens.specimenType',
    'study.assets.biospecimens.donorId',
  ],

  buildQuery(
    queryChunks: QueryClause[],
    filterQuery: QueryClause[],
    _pagination: PaginationState,
    _sort?: SortState,
  ): ElasticsearchQuery {
    // Aggregate by study to extract nested biospecimen assets stored under
    // study.assets.biospecimens; client-side pagination is applied in transformResponse.
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
    const studiesAgg = response.aggregations?.studies as BiospecimenStudyAggregationResponse | undefined
    const buckets = studiesAgg?.buckets || []
    const biospecimens: BiospecimenAsset[] = []

    for (const bucket of buckets) {
      const studyData = bucket.study_details?.hits?.hits?.[0]?._source?.study || {}
      const studyBiospecimens = studyData.assets?.biospecimens || []
      for (const [biospecimenIndex, biospecimen] of studyBiospecimens.entries()) {
        // biospecimenId may be absent from the indexed document; fall back to a
        // composite key so every row in the DataGrid has a unique id.
        biospecimens.push({
          biospecimenId: biospecimen.biospecimenId || `${bucket.key}-${biospecimenIndex}`,
          studyId: bucket.key,
          studyName: studyData.studyName || '',
          donorId: biospecimen.donorId || '',
          specimenType: biospecimen.specimenType as BioSpecimenType || '',
          preservationMethod: biospecimen.preservationMethod as BioSpecimenPreservationMethod || '',
          preservationDetails: biospecimen.preservationDetails || '',
          dateOfCollection: biospecimen.dateOfCollection || '',
          postMortemInterval: biospecimen.postMortemInterval || { value: 0, unit: PostMortemIntervalUnit.HOURS },
          sex: biospecimen.sex as Sex || '',
          age: biospecimen.age || 0,
          race: biospecimen.race || '',
          countryOfOrigin: biospecimen.countryOfOrigin || '',
          extractedDiagnoses: biospecimen.extractedDiagnoses || [],
          pathology: biospecimen.pathology || '',
          organization: biospecimen.organization || '',
          sourceSite: biospecimen.sourceSite || '',
          optionalDataUse: biospecimen.optionalDataUse || '',
        })
      }
    }

    const total = biospecimens.length
    const start = pagination.page * pagination.pageSize
    return {
      items: biospecimens.slice(start, start + pagination.pageSize),
      total,
      aggregations: response.aggregations || {},
    }
  },

  getRowId(row: LibraryRow): string | number {
    return (row as BiospecimenAsset).biospecimenId
  },

  isRowSelectable(_row: LibraryRow): boolean {
    // Biospecimens do not participate in dataset-level access requests
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

  makeColumns(props?: ColumnsProps): GridColDef[] {
    return makeBiospecimenColumns(props?.selectedMenuTab) as GridColDef[]
  },
}
