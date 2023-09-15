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

  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);

  // Datasets can be filtered from the parent component and redrawn frequently.
  const redrawRows = useCallback(() => {
    const rows = terms.map((term) => {
      const status = isNil(term.dacApproval) ? 'Pending' : (term.dacApproval ? 'Accepted' : 'Rejected');
      const primaryCodes = term.dataUse?.primary?.map(du => du.code);
      const secondaryCodes = term.dataUse?.secondary?.map(du => du.code);
      const editLink = (term.study?.studyId) ? '/study_update/' + term.study.studyId : '/dataset_update/' + term.datasetId;
      const editButton = (status === 'Accepted') ?
        <div/> :
        <div>
          <Button
            href={editLink}
            sx={{
              fontSize: 14,
              border: '1px solid #0948B7',
              borderRadius: '4px',
              height: 25,
              cursor: 'pointer',
              color: '#0948B7',
            }}>
            Edit
          </Button>
        </div>;
      const custodians = join(', ')(term.study?.dataCustodianEmail);
      return {
        datasetIdentifier: term.datasetIdentifier,
        datasetName: term.datasetName,
        dataSubmitter: term.createUserDisplayName,
        datasetCustodians: custodians,
        dac: term.dacName,
        dataUse: join(', ')(concat(primaryCodes)(secondaryCodes)),
        status: status,
        actions: editButton
      };
    });
    setRows(rows);
  }, [terms]);

  useEffect(() => {
    const init = async () => {
      try {
        setTerms(props.terms);
        setIsLoading(props.isLoading);
        redrawRows();
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve datasets from server'});
      }
    };
    init();
  }, [props, redrawRows]);

  const sortableTable = <SortableTable
    headCells={columns}
    rows={rows}
    defaultSort={columns[0].id}
    cellAlignment={'left'}/>;

  return isLoading ? spinner : sortableTable;
}