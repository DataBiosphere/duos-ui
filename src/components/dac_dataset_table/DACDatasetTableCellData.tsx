import React from 'react'
import style from 'src/pages/DACDatasets.module.css'
import { styles } from 'src/components/dac_dataset_table/DACDatasetConstants'
import { createDataUseDisplay, processDataUseCodes, TooltipPlacement } from 'src/utils/DataUseUtils'
import { DatasetTerm } from 'src/types/model'

export interface CellData {
  data: React.ReactNode
  value?: string | boolean
  id: string
  cellStyle: React.CSSProperties
  label: string
}

export interface CellDataParams {
  dataset: DatasetTerm
  label?: string
  divClass?: string
  spanClass?: string
  cellWidth?: string
  tooltipPlace?: TooltipPlacement
}

export function dataUseCellData({
  dataset,
  label = 'dataUseCellData',
  divClass = style['cell-data'],
  spanClass = style['data-use'],
  cellWidth = styles.cellWidths.dataUse,
  tooltipPlace = 'right',
}: CellDataParams): CellData {
  const { codeList } = processDataUseCodes(dataset)
  const display = createDataUseDisplay({ dataset, divClass, spanClass, tooltipPlace })
  return {
    data: display,
    value: codeList.join(', '),
    id: `data-use-cell-data-${dataset.datasetId}`,
    cellStyle: { width: cellWidth },
    label,
  }
}

const dacDatasetTableCellData = {
  dataUseCellData,
}

export default dacDatasetTableCellData
