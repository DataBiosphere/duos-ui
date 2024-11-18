import React from 'react';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetConstants';
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus';
import ReactTooltip from 'react-tooltip';

export const consoleTypes = { CHAIR: 'chair' };

export function duosIdCellData({dataset, label = 'duosIdCellData'}) {
  return {
    data: <div className={style['cell-data']}>{dataset.datasetIdentifier}</div>,
    value: dataset.datasetIdentifier,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.duosId},
    label
  };
}

export function duosPhsIdCellData({dataset, label = 'duosPhsIdCellData'}) {
  const displayValue = dataset.study?.phsId ? dataset.study.phsId : '';
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.duosId},
    label
  };
}

export function dataSubmitterCellData({dataset, label = 'dataSubmitterCellData'}) {
  const displayValue = dataset.submitter?.displayName ? dataset.submitter.displayName : '';
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `data-submitter-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.dataSubmitter},
    label
  };
}

export function datasetNameCellData({dataset, label = 'datasetNameCellData'}) {
  const displayValue = dataset.datasetName ? dataset.datasetName : '';
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function studyNameCellData({dataset, label = 'studyNameCellData'}) {
  const displayValue = dataset.study?.studyName ? dataset.study.studyName : '';
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function dataCustodianCellData({dataset, label = 'dataCustodianCellData'}) {
  const displayValue = dataset.study?.dataCustodianEmail ? dataset.study.dataCustodianEmail.join(', ') : '';
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `custodian-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.dataCustodian},
    label
  };
}

export function dataUseCellData({dataset, label = 'dataUseCellData', divClass = style['cell-data'], spanClass = style['data-use'], cellWidth = styles.cellWidths.dataUse, tooltipPlace = 'right'}) {
  const codesAndDescriptions = dataset.dataUse?.primary ? dataset.dataUse.primary.map((dataUse) => {
    if (dataUse.code === 'OTHER') {
      return {'code': `OTH1`, 'description': dataUse.description};
    } else if (dataUse.code === 'DS') {
      const disease = dataUse.description.substring(dataUse.description.indexOf(':') + 2);
      return {'code': `${dataUse.code} (${disease})`, 'description': dataUse.description};
    } else {
      return {'code': dataUse.code, 'description': dataUse.description};
    }
  }) : [];
  if (dataset.dataUse?.secondary) {
    dataset.dataUse?.secondary.forEach((dataUse) => {
      if (dataUse.code === 'OTHER') {
        codesAndDescriptions.push({'code': `OTH2`, 'description': dataUse.description});
      } else {
        codesAndDescriptions.push({'code': dataUse.code, 'description': dataUse.description});
      }
    });
  }
  const codeList = codesAndDescriptions.map(du => du.code);
  const display =
    <div className={divClass}>
      <span className={spanClass} data-tip={true} data-for={`dataset-data-use-${dataset.datasetId}`}>{codeList.join(', ')}</span>
      <ReactTooltip
        place={tooltipPlace}
        effect={'solid'}
        id={`dataset-data-use-${dataset.datasetId}`}>
        <ul>{codesAndDescriptions.map((translation, index) => {
          return <li key={`${translation.code}_s_${index}`}>{translation.code}: {translation.description}</li>;
        })}</ul>
      </ReactTooltip>
    </div>;
  return {
    data: display,
    value: codeList.join(', '),
    id: `data-use-cell-data-${dataset.datasetId}`,
    cellStyle: {width: cellWidth},
    label
  };
}

export function statusCellData({dataset, label = 'statusCellData', history}) {
  return {
    data: <DACDatasetApprovalStatus dataset={dataset} history={history}/>,
    id: `status-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.status},
    label
  };
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
};
