import React from 'react';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetsTable';
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
  const dbGaPPhsID = dataset.study?.properties?.filter(p => p.key === 'dbGaPPhsID')?.value;
  return {
    data: <div className={style['cell-data']}>{dbGaPPhsID}</div>,
    value: dbGaPPhsID,
    id: `identifier-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.duosId},
    label
  };
}

export function dataSubmitterCellData({dataset, label = 'dataSubmitterCellData'}) {
  const displayValue = dataset.submitter?.displayName;
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `data-submitter-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.dataSubmitter},
    label
  };
}

export function datasetNameCellData({dataset, label = 'datasetNameCellData'}) {
  return {
    data: <div className={style['cell-data']}>{dataset.datasetName}</div>,
    value: dataset.datasetName,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function studyNameCellData({dataset, label = 'studyNameCellData'}) {
  return {
    data: <div className={style['cell-data']}>{dataset.study?.studyName}</div>,
    value: dataset.study?.studyName,
    id: `name-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function dataCustodianCellData({dataset, label = 'dataCustodianCellData'}) {
  const displayValue = dataset.study?.dataCustodianEmail;
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `custodian-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.dataCustodian},
    label
  };
}

export function dataUseCellData({dataset, label = 'dataUseCellData'}) {
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
    <div className={style['cell-data']}>
      <span className={style['data-use']} data-tip={true} data-for={`dataset-data-use-${dataset.datasetId}`}>{codeList.join(', ')}</span>
      <ReactTooltip
        place={'right'}
        effect={'solid'}
        id={`dataset-data-use-${dataset.datasetId}`}>
        <ul>{codesAndDescriptions.map((translation, index) => {
          return <li key={`${translation.code}_s_${index}`}>{translation.code}: {translation.description}</li>;
        })}</ul>
      </ReactTooltip>
    </div>;
  return {
    data: display,
    value: codeList,
    id: `data-use-cell-data-${dataset.datasetId}`,
    cellStyle: {width: styles.cellWidths.dataUse},
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
