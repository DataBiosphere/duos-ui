import React from 'react'
import style from 'src/pages/DACDatasets.module.css'
import { styles } from './DACDatasetConstants'
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus'
import { createDataUseDisplay, processDataUseCodes } from 'src/utils/DataUseUtils.js'
import { DataSet } from 'src/libs/ajax/DataSet.js'

export const consoleTypes = { CHAIR: 'chair' }

export function duosIdCellData({ dataset, label = 'duosIdCellData' }) {
  return {
    data: <div className={style['cell-data']}>{dataset.datasetIdentifier}</div>,
    value: dataset.datasetIdentifier,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.duosId },
    label,
  }
}

export function nihCertificationLinkData({
  dataset,
  label = 'nihCertificationLink',
}) {
  return {
    data: dataset.hasInstitutionCertification
      ? (
          <div>
            <button
              onClick={async () => {
                DataSet.getNIHInstitutionalCertification(dataset.datasetId)
              }}
              className="button button-white"
              style={{ padding: '10px 12px' }}
            >
              <span className="glyphicon glyphicon-download-alt"></span>
            </button>
          </div>
        )
      : <div></div>,
    value: dataset.hasInstitutionCertification,
    id: `identifier-cell-data-${dataset.datasetId}-file`,
    cellStyle: { width: styles.cellWidths.duosId },
    label,
  }
}

export function duosPhsIdCellData({ dataset, label = 'duosPhsIdCellData' }) {
  const displayValue = dataset.study?.phsId ? dataset.study.phsId : ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.duosId },
    label,
  }
}

export function dataSubmitterCellData({ dataset, label = 'dataSubmitterCellData' }) {
  const displayValue = dataset.submitter?.displayName ? dataset.submitter.displayName : ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `data-submitter-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.dataSubmitter },
    label,
  }
}

export function datasetNameCellData({ dataset, label = 'datasetNameCellData' }) {
  const displayValue = dataset.datasetName ? dataset.datasetName : ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.datasetName },
    label,
  }
}

export function studyNameCellData({ dataset, label = 'studyNameCellData' }) {
  const displayValue = dataset.study?.studyName ? dataset.study.studyName : ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.datasetName },
    label,
  }
}

export function dataCustodianCellData({ dataset, label = 'dataCustodianCellData' }) {
  const displayValue = dataset.study?.dataCustodianEmail ? dataset.study.dataCustodianEmail.join(', ') : ''
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `custodian-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.dataCustodian },
    label,
  }
}

export function dataUseCellData({ dataset, label = 'dataUseCellData', divClass = style['cell-data'], spanClass = style['data-use'], cellWidth = styles.cellWidths.dataUse, tooltipPlace = 'right' }) {
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

export function statusCellData({ dataset, label = 'statusCellData' }) {
  return {
    data: <DACDatasetApprovalStatus dataset={dataset} />,
    id: `status-cell-data-${dataset.datasetId}`,
    cellStyle: { width: styles.cellWidths.status },
    label,
  }
}

export default {
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
