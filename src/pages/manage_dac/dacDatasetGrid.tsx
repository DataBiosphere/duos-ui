import React from 'react'
import { Link } from 'react-router'
import { GridColDef } from '@mui/x-data-grid'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'
import { DATA_USE_GRID_COLUMN } from 'src/components/dataUseGridColumn'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import type { Dataset, DatasetProperty, DataUseSummary } from 'src/types/model'
import type { ElasticsearchQuery } from 'src/types/elastic'

export const DAC_DATASET_PAGE_SIZE_OPTIONS = [10, 25, 50]

export const DAC_DATASET_GRID_SX = {
  '& .MuiDataGrid-cell:focus': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
}

const getDatasetProperty = (properties: DatasetProperty[], propName: string): string => {
  const prop = properties?.find(p => p.propertyName.toLowerCase() === propName.toLowerCase())
  return prop?.propertyValue ?? ''
}

/**
 * Data use for a DAC's datasets, read from the search index so the chips match the Data Library
 * and DAC Datasets. Resolves to an empty map, after showing an error, if the index call fails.
 */
export const loadIndexedDataUse = async (dacId: number): Promise<Map<number, DataUseSummary>> => {
  const query = { from: 0, size: 10000, query: { terms: { dacId: [dacId] } } } as unknown as ElasticsearchQuery
  try {
    const terms = await DataSet.searchDatasetIndex(query)
    return new Map(terms.map(term => [term.datasetId, term.dataUse]))
  }
  catch {
    Notifications.showError({ text: 'Failed to load data use limitations.' })
    return new Map()
  }
}

export const toDacDatasetRow = (dataset: Dataset, dataUse: DataUseSummary | undefined) => {
  const props = dataset.properties ?? []
  return {
    id: dataset.datasetId,
    datasetIdentifier: dataset.datasetIdentifier,
    name: dataset.name ?? '',
    url: validateHttpUrl(getDatasetProperty(props, 'url')) ?? '',
    dataType: getDatasetProperty(props, 'Data Type'),
    pi: dataset.study?.piName || getDatasetProperty(props, 'Principal Investigator(PI)'),
    participants: getDatasetProperty(props, '# of participants'),
    dataUse,
  }
}

export const DAC_DATASET_COLUMNS: GridColDef[] = [
  {
    field: 'datasetIdentifier',
    headerName: 'Dataset ID',
    width: 140,
    renderCell: params => (
      params.value
        ? <Link to={`/dataset/${params.value}`} style={{ color: '#216fb4' }}>{params.value}</Link>
        : <span style={{ color: '#999' }}>---</span>
    ),
  },
  { field: 'name', headerName: 'Dataset Name', flex: 1, minWidth: 160 },
  {
    field: 'url',
    headerName: 'URL',
    width: 80,
    renderCell: params => (
      params.value
        ? <a href={params.value} target="_blank" rel="noreferrer" style={{ color: '#216fb4' }}>Link</a>
        : <span style={{ color: '#999' }}>---</span>
    ),
  },
  {
    ...DATA_USE_GRID_COLUMN,
    flex: 1,
    // Same minimum as the DAC Datasets grid, which its longest code sequences need
    minWidth: 230,
  },
  { field: 'dataType', headerName: 'Data Type', width: 120 },
  { field: 'pi', headerName: 'Principal Investigator', width: 160 },
  { field: 'participants', headerName: '# of Participants', width: 130 },
]
