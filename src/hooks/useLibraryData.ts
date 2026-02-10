import { useQuery } from '@tanstack/react-query'
import { DataSet } from 'src/libs/ajax/DataSet'
import {
  AssetType,
  FilterState,
  LibraryVersion,
  PaginationState,
  SortState,
  ElasticsearchQuery,
  QueryClause,
  StudyAggregation,
  ElasticsearchResponse,
  StudyAggregationResponse,
} from 'src/types/library'

/**
 * Build ElasticSearch query for datasets or studies
 */
export const buildElasticsearchQuery = (
  libraryConfig: LibraryVersion,
  assetType: AssetType,
  filters: FilterState,
  searchTerm: string,
  pagination: PaginationState,
  sort?: SortState,
): ElasticsearchQuery => {
  const queryChunks: QueryClause[] = [
    {
      exists: {
        field: 'study',
      },
    },
  ]

  // Add library-specific query
  if (libraryConfig.query) {
    queryChunks.push(libraryConfig.query as QueryClause)
  }

  // Add search modifier if search term exists
  if (searchTerm.length > 0) {
    queryChunks.push({
      multi_match: {
        query: searchTerm,
        type: 'phrase_prefix',
        fields: [
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
        ],
      },
    })
  }

  // Build filter query
  const filterQuery: QueryClause[] = []

  if (filters.accessManagement.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.accessManagement.map(term => ({
          term: {
            'accessManagement.keyword': term,
          },
        })),
      },
    })
  }

  if (filters.dataUse.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.dataUse.map(term => ({
          match: {
            'dataUse.primary.code': term,
          },
        })),
      },
    })
  }

  if (filters.dataType.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.dataType.map(term => ({
          match: {
            'study.dataTypes': term,
          },
        })),
      },
    })
  }

  if (filters.dac.length > 0) {
    filterQuery.push({
      bool: {
        should: filters.dac.map(term => ({
          match_phrase: {
            'dac.dacName': term,
          },
        })),
      },
    })
  }

  if (
    filters.participantCount.min !== undefined
    || filters.participantCount.max !== undefined
  ) {
    filterQuery.push({
      range: {
        participantCount: {
          ...(filters.participantCount.min !== undefined && {
            gte: filters.participantCount.min,
          }),
          ...(filters.participantCount.max !== undefined && {
            lte: filters.participantCount.max,
          }),
        },
      },
    })
  }

  // Build different query structure for studies vs datasets
  if (assetType === AssetType.STUDIES) {
    // For studies, use aggregations
    return {
      size: 0, // Don't return documents
      query: {
        bool: {
          must: queryChunks,
          ...(filterQuery.length > 0 && { filter: filterQuery }),
        },
      },
      aggs: {
        studies: {
          composite: {
            size: pagination.pageSize,
            sources: [
              {
                study_id: {
                  terms: {
                    field: 'study.studyId',
                  },
                },
              },
            ],
          },
          aggs: {
            study_details: {
              top_hits: {
                size: 1,
                _source: ['study.*'],
              },
            },
            dataset_count: {
              value_count: {
                field: 'datasetId',
              },
            },
            total_participants: {
              sum: {
                field: 'participantCount',
              },
            },
            dataset_ids: {
              terms: {
                field: 'datasetId',
                size: 10000,
              },
            },
          },
        },
        // Add filter aggregations
        access_management: {
          terms: {
            field: 'accessManagement.keyword',
          },
        },
        data_use: {
          terms: {
            field: 'dataUse.primary.code.keyword',
          },
        },
        data_type: {
          terms: {
            field: 'study.dataTypes.keyword',
          },
        },
        dac: {
          terms: {
            field: 'dac.dacName.keyword',
          },
        },
      },
    }
  }

  // For datasets, use standard pagination
  return {
    from: pagination.page * pagination.pageSize,
    size: pagination.pageSize,
    query: {
      bool: {
        must: queryChunks,
        ...(filterQuery.length > 0 && { filter: filterQuery }),
      },
    },
    ...(sort && {
      sort: [
        {
          [sort.field]: {
            order: sort.order,
          },
        },
      ],
    }),
    // Add filter aggregations
    aggs: {
      access_management: {
        terms: {
          field: 'accessManagement.keyword',
        },
      },
      data_use: {
        terms: {
          field: 'dataUse.primary.code.keyword',
        },
      },
      data_type: {
        terms: {
          field: 'study.dataTypes.keyword',
        },
      },
      dac: {
        terms: {
          field: 'dac.dacName.keyword',
        },
      },
    },
  }
}

/**
 * Transform aggregation response to study rows
 */
export const transformStudyAggregations = (
  response: ElasticsearchResponse,
): StudyAggregation[] => {
  const studiesAgg = response.aggregations?.studies as StudyAggregationResponse | undefined
  const buckets = studiesAgg?.buckets || []

  return buckets.map((bucket) => {
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
}

/**
 * Custom hook for fetching library data
 */
export const useLibraryData = (
  libraryConfig: LibraryVersion,
  assetType: AssetType,
  filters: FilterState,
  searchTerm: string,
  pagination: PaginationState,
  sort?: SortState,
) => {
  return useQuery({
    queryKey: [
      'library-data',
      libraryConfig.key,
      assetType,
      filters,
      searchTerm,
      pagination,
      sort,
    ],
    queryFn: async () => {
      const query = buildElasticsearchQuery(
        libraryConfig,
        assetType,
        filters,
        searchTerm,
        pagination,
        sort,
      )

      // Use v2 endpoint for both, just different query structures
      const response = await DataSet.searchDatasetIndexV2(query)

      // fetchPost returns { data: actualData }
      const actualData = response.data || response

      // Transform aggregations to study rows if needed
      if (assetType === AssetType.STUDIES && actualData.aggregations) {
        const studies = transformStudyAggregations(actualData)
        return {
          items: studies,
          total: actualData.aggregations.studies?.buckets?.length || 0,
          aggregations: actualData.aggregations,
        }
      }

      // For datasets, the response might be an array or an object with hits
      const items = Array.isArray(actualData) ? actualData : (actualData.hits?.hits?.map((h: any) => h._source) || [])
      return {
        items,
        total: Array.isArray(actualData) ? actualData.length : (actualData.hits?.total?.value || 0),
        aggregations: {},
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    // Provide default data structure on error to prevent crashes
    placeholderData: {
      items: [],
      total: 0,
      aggregations: {},
    },
  })
}
