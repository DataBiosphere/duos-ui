import type { CSSProperties } from 'react'
import { styles } from 'src/utils/darDatasetUtils'
import { Dataset } from 'src/types/model'

export interface CellData {
  data: string
  id: string
  style?: CSSProperties
  label: string
}

export interface BucketCellDataParams {
  dataUseGroup: string
  label?: string
  datasets?: Dataset[]
}

export function dataUseGroupCellData({ dataUseGroup, label = 'data-use' }: BucketCellDataParams): CellData {
  return {
    data: label,
    id: dataUseGroup,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.dataUseGroup,
      fontWeight: 'bold',
      paddingRight: '2%',
    },
    label,
  }
}

export function numberOfDatasetsCellData({ datasets = [], dataUseGroup, label = 'number-of-datasets' }: BucketCellDataParams): CellData {
  return {
    data: `${datasets.length}`,
    id: dataUseGroup,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.numberOfDatasets,
      fontWeight: 'bold',
      paddingRight: '2%',
    },
    label,
  }
}

export function datasetsCellData({ datasets = [], dataUseGroup, label = 'datasets' }: BucketCellDataParams): CellData {
  return {
    data: datasets.map(ds => ds.datasetIdentifier).join(', '),
    id: dataUseGroup,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.datasets,
      paddingRight: '2%',
    },
    label,
  }
}

export default {
  dataUseGroupCellData,
  numberOfDatasetsCellData,
  datasetsCellData,
}
