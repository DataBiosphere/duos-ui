import {button, div, h} from 'react-hyperscript-helpers';
import {Link} from 'react-router-dom';
import {isNil} from 'lodash/fp';
import {styles} from './DACDatasetsTable';
import { findPropertyValue, getDataUseCodes } from '../../utils/DatasetUtils';
import {span} from 'react-hyperscript-helpers';
import {DAC} from '../../libs/ajax';

export const consoleTypes = {
  CHAIR: 'chair',
  DATA_SUBMITTER: 'dataSubmitter',
};

export function duosIdCellData({dataset, label='duosIdCellData'}) {
  return {
    data: div({
      className: 'cell-data',
    }, [h(Link, {to: `dataset_statistics/${dataset.dataSetId}`}, [dataset.alias])]),
    value: dataset.alias,
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.duosId },
    label
  };
}

export function dataSubmitterCellData({dataset, label='dataSubmitterCellData'}) {
  const dataSubmitter = findPropertyValue(dataset, 'Data Depositor');
  return {
    data: div({
      className: 'cell-data',
    }, dataSubmitter),
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.dataSubmitter },
    label
  };
}

export function datasetNameCellData({dataset, label='datasetNameCellData'}) {
  const datasetName = findPropertyValue(dataset, 'Dataset Name');
  return {
    data: div({
      className: 'cell-data',
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
      className: 'cell-data',
    }, dataCustodian),
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.dataCustodian },
    label
  };
}

export function dataUseCellData({dataset, label='dataUseCellData'}) {
  getDataUseCodes(dataset);
  return {
    data: div({
      className: 'cell-data',
    }, dataset.codeList),
    id: dataset.dataSetId,
    cellStyle: { width: styles.cellWidths.dataUse },
    label
  };
}

export function statusCellData({dataset, label='statusCellData'}) {
  const updateApprovalStatus = async (status) => {
    await DAC.updateApprovalStatus(dataset.dacId, dataset.dataSetId, status);
  };

  const dacAccepted = div({
    style: {color: '#1ea371', fontWeight: 'bold'}
  },[
    span('ACCEPTED'),
    h(Link,{
      style: {marginLeft: '15px'},
      id: `${dataset.dataSetId}_edit`,
      className: 'glyphicon glyphicon-pencil',
      isRendered: true,
      to: `dataset_registration/${dataset.dataSetId}`
    })
  ]);

  const dacRejected = div({
    style: {color: '#000000', fontWeight: 'bold'}
  },[span('REJECTED')]);

  const approvalActions = div({}, [
    button({
      id: 'btn_approveDataset',
      isRendered: true,
      disabled: false,
      onClick: () => updateApprovalStatus(true),
      className: 'btn-primary-dac-datasets'
    }, ['YES']),
    button({
      id: 'btn_rejectDataset',
      isRendered: true,
      disabled: false,
      onClick: () => updateApprovalStatus(false),
      className: 'btn-primary-dac-datasets'
    }, ['NO'])
  ]);

  const status = (!isNil(dataset?.dacApproval))
    ? dataset.dacApproval
      ? dacAccepted
      : dacRejected
    : approvalActions; // todo: add buttons and actions


  return {
    data: div({
      style: {
        display: 'flex',
        alignItems: 'center',
      }
    }, [status]),
    value: status,
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