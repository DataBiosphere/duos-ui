import React from 'react';
import {Link} from 'react-router-dom';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetsTable';
import {findPropertyValue, getDataUseCodes} from '../../utils/DatasetUtils';
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus';

export const consoleTypes = {
  CHAIR: 'chair'
};

export function duosIdCellData({dataset, label = 'duosIdCellData'}) {
  return {
    data: <div className={style['cell-data']}>
      <Link to={`dataset_statistics/${dataset.dataSetId}`}>{dataset.datasetIdentifier}</Link>
    </div>,
    value: dataset.datasetIdentifier,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.duosId},
    label
  };
}

export function dataSubmitterCellData({dataset, label = 'dataSubmitterCellData'}) {
  const dataSubmitter = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: <div className={style['cell-data']}>{dataSubmitter}</div>,
    value: dataSubmitter,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.dataSubmitter},
    label
  };
}

export function datasetNameCellData({dataset, label = 'datasetNameCellData'}) {
  const datasetName = findPropertyValue(dataset, 'Dataset Name');
  return {
    data: <div className={style['cell-data']}>
      <Link to={`dataset_registration/${dataset.dataSetId}`}>{datasetName}</Link>
    </div>,
    value: datasetName,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.datasetName},
    label
  };
}

export function dataCustodianCellData({dataset, label = 'dataCustodianCellData'}) {
  const dataCustodian = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: <div className={style['cell-data']}>{dataCustodian}</div>,
    value: dataCustodian,
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