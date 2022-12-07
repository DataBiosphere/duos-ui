import {styles} from './DACDatasetTable';
import { findPropertyValue, getDataUseCodes } from '../../utils/DatasetUtils';
import {isNil} from 'lodash/fp';

export const consoleTypes = {
  CHAIR: 'chair',
  DATA_SUBMITTER: 'dataSubmitter',
};

export function duosIdCellData({dataset, label='duosIdCellData'}) {
  return {
    data: dataset.alias,
    id: dataset.datasetId,
    cellStyle: { width: styles.cellWidths.duosId },
    label
  };
}

export function dataSubmitterCellData({dataset, label='dataSubmitterCellData'}) {
  const dataSubmitter = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: dataSubmitter,
    id: dataset.datasetId,
    cellStyle: { width: styles.cellWidths.dataSubmitter },
    label
  };
}

export function datasetNameCellData({dataset, label='datasetNameCellData'}) {
  const datasetName = findPropertyValue(dataset, 'Dataset Name');
  return {
    data: datasetName,
    id: dataset.datasetId,
    cellStyle: { width: styles.cellWidths.datasetName },
    label
  };
}

export function dataCustodianCellData({dataset, label='dataCustodianCellData'}) {
  const dataCustodian = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: dataCustodian,
    id: dataset.datasetId,
    cellStyle: { width: styles.cellWidths.dataCustodian },
    label
  };
}

export function dataUseCellData({dataset, label='dataUseCellData'}) {
  getDataUseCodes(dataset);
  return {
    data: dataset.codeList,
    id: dataset.datasetId,
    cellStyle: { width: styles.cellWidths.dataUse },
    label
  };
}

export function statusCellData({dataset, label='statusCellData'}) {
  const status = (!isNil(dataset?.dacApproval))
    ? dataset.dacApproval
      ? 'ACCEPTED' // todo: add edit icon + link
      : 'REJECTED'
    : 'YES/NO'; // todo: add buttons and actions
  return {
    data: status,
    id: dataset.datasetId,
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