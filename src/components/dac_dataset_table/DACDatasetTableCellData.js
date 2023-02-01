import React from 'react';
import {div, h} from 'react-hyperscript-helpers';
import {Link} from 'react-router-dom';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetsTable';
import {findPropertyValue, getDataUseCodes} from '../../utils/DatasetUtils';
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus';

export const consoleTypes = {
  CHAIR: 'chair'
};

export function duosIdCellData({dataset, label='duosIdCellData'}) {
  return {
    data: div({
      className: style['cell-data'],
    }, [h(Link, {to: `dataset_statistics/${dataset.dataSetId}`}, [dataset.datasetIdentifier])]),
    value: dataset.datasetIdentifier,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.duosId },
    label
  };
}

export function dataSubmitterCellData({dataset, label='dataSubmitterCellData'}) {
  const dataSubmitter = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: div({
      className: style['cell-data'],
    }, dataSubmitter),
    value: dataSubmitter,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.dataSubmitter },
    label
  };
}

export function datasetNameCellData({dataset, label='datasetNameCellData'}) {
  const datasetName = findPropertyValue(dataset, 'Dataset Name');
  return {
    data: div({
      className: style['cell-data'],
    }, [h(Link, {to: `dataset_registration/${dataset.dataSetId}`}, [datasetName])]),
    value: datasetName,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.datasetName },
    label
  };
}

export function dataCustodianCellData({dataset, label='dataCustodianCellData'}) {
  const dataCustodian = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: div({
      className: style['cell-data'],
    }, dataCustodian),
    value: dataCustodian,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.dataCustodian },
    label
  };
}

export function dataUseCellData({dataset, label='dataUseCellData'}) {
  getDataUseCodes(dataset);
  return {
    data: div({
      className: style['cell-data'],
    }, dataset.codeList),
    value: dataset.codeList,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.dataUse },
    label
  };
}

export function statusCellData({dataset, label='statusCellData'}) {
  return {
    data: <DACDatasetApprovalStatus dataset={dataset}/>, //<div style={{display: 'flex', alignItems: 'center'}}>{status}</div>,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.status },
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