import React from 'react'
import style from 'src/pages/DACDatasets.module.css'
import { styles } from 'src/components/dac_dataset_table/DACDatasetConstants'
import DACDatasetApprovalStatus from 'src/components/dac_dataset_table/DACDatasetApprovalStatus'
import { createDataUseDisplay, processDataUseCodes, TooltipPlacement } from 'src/utils/DataUseUtils'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DatasetTerm } from 'src/types/model'
import { NavigateFunction } from 'react-router'

export const consoleTypes = { CHAIR: 'chair' } as const

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
  consoleType?: string
  navigate?: NavigateFunction
  divClass?: string
  spanClass?: string
  cellWidth?: string
  tooltipPlace?: TooltipPlacement
}

export function duosIdCellData({ dataset, label = 'duosIdCellData' }: CellDataParams): CellData {
  return {
    data: <div className={style['cell-data']}>{dataset.datasetIdentifier}</div>,
    value: dataset.datasetIdentifier,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.duosId },
    label,
  }
}

export function nihCertificationLinkData({ dataset, label = 'nihCertificationLink' }: CellDataParams): CellData {
  return {
    data: dataset.hasInstitutionCertification
      ? (
          <div>
            <button
              onClick={() => { DataSet.getNIHInstitutionalCertification(dataset.datasetId) }}
              className="button button-white"
              style={{ padding: '10px 12px' }}
            >
              <span className="glyphicon glyphicon-download-alt" />
            </button>
          </div>
        )
      : <div />,
    value: dataset.hasInstitutionCertification,
    id: `identifier-cell-data-${dataset.datasetId}-file`,
    cellStyle: { width: styles.cellWidths.certificationLink },
    label,
  }
}

export function duosPhsIdCellData({ dataset, label = 'duosPhsIdCellData' }: CellDataParams): CellData {
  const displayValue = dataset.study?.phsId ?? ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.phsId },
    label,
  }
}

export function dataSubmitterCellData({ dataset, label = 'dataSubmitterCellData' }: CellDataParams): CellData {
  const displayValue = dataset.submitter?.displayName ?? ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `data-submitter-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.dataSubmitter },
    label,
  }
}

export function datasetNameCellData({ dataset, label = 'datasetNameCellData' }: CellDataParams): CellData {
  const displayValue = dataset.datasetName ?? ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.datasetName },
    label,
  }
}

export function studyNameCellData({ dataset, label = 'studyNameCellData' }: CellDataParams): CellData {
  const displayValue = dataset.study?.studyName ?? ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.studyName },
    label,
  }
}

export function dataCustodianCellData({ dataset, label = 'dataCustodianCellData' }: CellDataParams): CellData {
  const displayValue = dataset.study?.dataCustodianEmail?.join(', ') ?? ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `custodian-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.dataCustodian },
    label,
  }
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

export function statusCellData({ dataset, label = 'statusCellData' }: CellDataParams): CellData {
  return {
    data: <DACDatasetApprovalStatus dataset={dataset} />,
    id: `status-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.status },
    label,
  }
}

const dacDatasetTableCellData = {
  duosIdCellData,
  duosPhsIdCellData,
  datasetNameCellData,
  studyNameCellData,
  dataSubmitterCellData,
  dataCustodianCellData,
  dataUseCellData,
  statusCellData,
  nihCertificationLinkData,
}

export default dacDatasetTableCellData
