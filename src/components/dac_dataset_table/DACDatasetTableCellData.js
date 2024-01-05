import React from 'react';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetsTable';
import {DatasetService} from '../../utils/DatasetService';
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus';
import {isEmpty, map} from 'lodash/fp';
import ReactTooltip from 'react-tooltip';

export const consoleTypes = { CHAIR: 'chair' };

export function duosIdCellData({dataset, label = 'duosIdCellData'}) {
  return {
    data: <div className={style['cell-data']}>{dataset.datasetIdentifier}</div>,
    value: dataset.datasetIdentifier,
    id: `identifier-cell-data-${dataset.dataSetId}`,
    cellStyle: {width: styles.cellWidths.duosId},
    label
  };
}

export function dataSubmitterCellData({dataset, label = 'dataSubmitterCellData'}) {
  const dataDepositor = DatasetService.findDatasetPropertyValue(dataset, 'Data Depositor');
  const displayValue = isEmpty(dataDepositor) ? dataset.createUser.displayName : dataDepositor;
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `data-submitter-cell-data-${dataset.dataSetId}`,
    cellStyle: {width: styles.cellWidths.dataSubmitter},
    label
  };
}

export function datasetNameCellData({dataset, label = 'datasetNameCellData'}) {
  return {
    data: <div className={style['cell-data']}>{dataset.name}</div>,
    value: dataset.name,
    id: `name-cell-data-${dataset.dataSetId}`,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function dataCustodianCellData({dataset, label = 'dataCustodianCellData'}) {
  // Newer datasets have a list of data custodian emails.
  // Older datasets may or may not have a data depositor
  const datasetCustodians = DatasetService.findDatasetPropertyValueList(dataset, 'Data Custodian Email')?.join(', ');
  const dataDepositor = DatasetService.findDatasetPropertyValue(dataset, 'Data Depositor');
  const studyCustodians = DatasetService.findDatasetPropertyValueList(dataset.study, 'dataCustodianEmail')?.join(', ');
  const displayValue = isEmpty(datasetCustodians) ? (isEmpty(dataDepositor) ? studyCustodians : dataDepositor) : datasetCustodians;
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: `custodian-cell-data-${dataset.dataSetId}`,
    cellStyle: {width: styles.cellWidths.dataCustodian},
    label
  };
}

export function dataUseCellData({dataset, label = 'dataUseCellData'}) {
  const translationList = map((translation, index) => {
    return <li key={`${translation.code}_${index}`}>{translation.code}: {translation.description}</li>;
  })(dataset.translations);
  const display =
    <div className={style['cell-data']}>
      <span className={style['data-use']} data-tip={true} data-for={`dataset-data-use-${dataset.dataSetId}`}>{dataset.codeList}</span>
      <ReactTooltip
        place={'right'}
        effect={'solid'}
        id={`dataset-data-use-${dataset.dataSetId}`}>
        <ul>{translationList}</ul>
      </ReactTooltip>
    </div>;
  return {
    data: display,
    value: dataset.codeList,
    id: `data-use-cell-data-${dataset.dataSetId}`,
    cellStyle: {width: styles.cellWidths.dataUse},
    label
  };
}

export function statusCellData({dataset, label = 'statusCellData'}) {
  return {
    data: <DACDatasetApprovalStatus dataset={dataset}/>,
    id: `status-cell-data-${dataset.dataSetId}`,
    cellStyle: {width: styles.cellWidths.status},
    label
  };
}

export default {
  duosIdCellData,
  dataSubmitterCellData,
  datasetNameCellData,
  dataCustodianCellData,
  dataUseCellData,
  statusCellData,
};
