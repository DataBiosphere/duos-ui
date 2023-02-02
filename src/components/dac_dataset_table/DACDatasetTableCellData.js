import React from 'react';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetsTable';
import {findPropertyValue, findPropertyValueList, getDataUseCodes} from '../../utils/DatasetUtils';
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus';
import {isEmpty, join} from 'lodash/fp';

export const consoleTypes = {
  CHAIR: 'chair'
};

export function duosIdCellData({dataset, label = 'duosIdCellData'}) {
  return {
    data: <div className={style['cell-data']}>{dataset.datasetIdentifier}</div>,
    value: dataset.datasetIdentifier,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.duosId},
    label
  };
}

export function dataSubmitterCellData({dataset, label = 'dataSubmitterCellData'}) {
  // We need an update to the dac-dataset API to get the data submitter value.
  // The Data Submitter is always pre-populated with the user who originally created the dataset.
  // See https://broadworkbench.atlassian.net/browse/DUOS-2291 for details
  // Until that happens, we can rely on the data depositor field.
  const dataDepositor = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: <div className={style['cell-data']}>{dataDepositor}</div>,
    value: dataDepositor,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.dataSubmitter},
    label
  };
}

export function datasetNameCellData({dataset, label = 'datasetNameCellData'}) {
  const datasetName = findPropertyValue(dataset, 'Dataset Name');
  return {
    data: <div className={style['cell-data']}>{datasetName}</div>,
    value: datasetName,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function dataCustodianCellData({dataset, label = 'dataCustodianCellData'}) {
  // Newer datasets have a list of data custodian emails.
  // Older datasets may or may not have a data depositor
  const dataCustodians = findPropertyValueList(dataset, 'Data Custodian Email');
  const dataDepositor = findPropertyValue(dataset, 'Data Depositor');
  const displayValue = isEmpty(dataCustodians) ? dataDepositor : join(', ')(dataCustodians);
  return {
    data: <div className={style['cell-data']}>{displayValue}</div>,
    value: displayValue,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.dataCustodian},
    label
  };
}

export function dataUseCellData({dataset, label = 'dataUseCellData'}) {
  getDataUseCodes(dataset);
  return {
    data: <div className={style['cell-data']}>{dataset.codeList}</div>,
    value: dataset.codeList,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.dataUse},
    label
  };
}

export function statusCellData({dataset, label = 'statusCellData'}) {
  return {
    data: <DACDatasetApprovalStatus dataset={dataset}/>,
    id: dataset.dataSetId,
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