import React from 'react';
import style from '../../pages/DACDatasets.module.css';
import {styles} from './DACDatasetsTable';
import {DatasetService} from '../../utils/DatasetService';
import DACDatasetApprovalStatus from './DACDatasetApprovalStatus';
import {isEmpty, join, map} from 'lodash/fp';
import ReactTooltip from 'react-tooltip';

export const consoleTypes = { CHAIR: 'chair' };

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
  const dataDepositor = DatasetService.findDatasetPropertyValue(dataset, 'Data Depositor');
  return {
    data: <div className={style['cell-data']}>{dataDepositor}</div>,
    value: dataDepositor,
    id: dataset.dataSetId,
    cellStyle: {width: styles.cellWidths.dataSubmitter},
    label
  };
}

export function datasetNameCellData({dataset, label = 'datasetNameCellData'}) {
  const datasetName = DatasetService.findDatasetPropertyValue(dataset, 'Dataset Name');
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
  const dataCustodians = DatasetService.findDatasetPropertyValueList(dataset, 'Data Custodian Email');
  const dataDepositor = DatasetService.findDatasetPropertyValue(dataset, 'Data Depositor');
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
  const translationList = map((translation) => {
    return <li key={translation.code}>{translation.code}: {translation.description}</li>;
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
