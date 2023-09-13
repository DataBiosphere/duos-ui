import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {Notifications} from '../../libs/utils';
import loadingIndicator from '../../images/loading-indicator.svg';
import SortableTable from '../../components/sortable_table/SortableTable';
import {concat, isNil, join} from 'lodash/fp';
import Button from '@mui/material/Button';


export default function DataSubmitterDatasetsTable(props) {

  const spinner = <div style={{textAlign: 'center', height: '44', width: '180'}}>
    <img src={loadingIndicator} alt={'Loading'}/>
  </div>;

  const columns = [
    {
      id: 'datasetIdentifier',
      numeric: false,
      disablePadding: false,
      label: 'DUOS ID',
    },
    {
      id: 'datasetName',
      numeric: false,
      disablePadding: false,
      label: 'Dataset Name',
    },
    {
      id: 'datasetSubmitter',
      numeric: false,
      disablePadding: false,
      label: 'Dataset Submitter',
    },
    {
      id: 'datasetCustodians',
      numeric: false,
      disablePadding: false,
      label: 'Dataset Custodians',
    },
    {
      id: 'dac',
      numeric: false,
      disablePadding: false,
      label: 'DAC',
    },
    {
      id: 'dataUse',
      numeric: false,
      disablePadding: false,
      label: 'Data Use',
    },
    {
      id: 'status',
      numeric: false,
      disablePadding: false,
      label: 'Status',
    },
    {
      id: 'actions',
      numeric: false,
      disablePadding: false,
      label: 'Actions',
    }
  ];

  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Datasets can be filtered from the parent component and redrawn frequently.
  const redrawRows = useCallback(() => {
    const rows = datasets.map((dataset) => {
      const status = isNil(dataset.dacApproval) ? 'Pending' : (dataset.dacApproval ? 'Accepted' : 'Rejected');
      const primaryCodes = dataset.dataUse?.primary.map(du => du.code);
      const secondaryCodes = dataset.dataUse?.secondary.map(du => du.code);
      const editButton = (status === 'Accepted') ?
        <div/> :
        <div>
          <Button
            onClick={() => {}}>
            Edit
          </Button>
        </div>;
      return {
        datasetIdentifier: dataset.datasetIdentifier,
        datasetName: dataset.datasetName,
        dataSubmitter: dataset?.createUserDisplayName,
        datasetCustodians: '',
        dac: dataset.dacName,
        dataUse: join(', ')(concat(primaryCodes)(secondaryCodes)),
        status: status,
        actions: editButton
      };
    });
    setRows(rows);
  }, [datasets]);

  useEffect(() => {
    const init = async () => {
      try {
        setDatasets(props.datasets);
        setIsLoading(props.isLoading);
        redrawRows();
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve datasets from server'});
      }
    };
    init();
  }, [props, redrawRows]);

  const sortableTable = <SortableTable headCells={columns} rows={rows} defaultSort={columns[0].id}/>;

  return isLoading ? spinner : sortableTable;
}