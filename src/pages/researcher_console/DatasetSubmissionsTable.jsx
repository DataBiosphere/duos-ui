import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {Notifications} from '../../libs/utils';
import loadingIndicator from '../../images/loading-indicator.svg';
import SortableTable from '../../components/sortable_table/SortableTable';
import {cloneDeep, concat, findIndex, join, isNil} from 'lodash/fp';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import {DataSet} from '../../libs/ajax';
import { ConfirmationDialog } from '../..//components/modals/ConfirmationDialog';


export default function DatasetSubmissionsTable(props) {

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
  const [selectedTerm, setSelectedTerm] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);

  const handleClick = (term) => {
    setOpen(true);
    setSelectedTerm(term);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const removeDataset = async (termToDelete) => {
    const termName = termToDelete.datasetName;
    const termId = termToDelete.datasetId;
    setOpen(false);
    try {
      DataSet.deleteDataset(termId).then(() => {
        Notifications.showSuccess({
          text: `Removed dataset '${termName}' successfully.`,
        });
        props.history.push('/datalibrary');});
    } catch (error) {
      Notifications.showError({
        text: `Error removing ${termName} as a dataset`,
      });
    }
  };

  // Datasets can be filtered from the parent component and redrawn frequently.
  const redrawRows = useCallback((open, selectedTerm) => {
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
              fontSize: '1.25rem',
              border: '1px solid #0948B7',
              borderRadius: 1,
              height: 25
            }}>
            Edit
          </Button>
        </div>;
      const deleteButton = (status !== 'Accepted' && term.deletable) ?
        <div>
          <Link
            style={{marginLeft: '15px'}}
            id={`${term.datasetId}_delete`}
            className={'glyphicon glyphicon-trash'}
            onClick={() => handleClick(term)}
            to={`#`}
          />
          <ConfirmationDialog 
            title="Delete dataset" 
            openState={open} 
            close={handleClose}
            action={() => removeDataset(selectedTerm)}
            description={`Are you sure you want to delete the dataset '${selectedTerm.datasetIdentifier}'?`} 
          />
        </div> :
        <div/>;
      const custodians = join(', ')(term.study?.dataCustodianEmail);
      return {
        datasetIdentifier: term.datasetIdentifier,
        datasetName: term.datasetName,
        dataSubmitter: term.createUserDisplayName,
        datasetCustodians: custodians,
        dac: term.dac?.dacName,
        dataUse: join(', ')(concat(primaryCodes)(secondaryCodes)),
        status: status,
        actions: editButton, deleteButton
      };
    });
    setRows(rows);
  }, [terms]);

  useEffect(() => {
    const init = async () => {
      try {
        setTerms(props.terms);
        setIsLoading(props.isLoading);
        redrawRows(open,selectedTerm);
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve datasets from server'});
      }
    };
    init();
  }, [props, redrawRows, open, selectedTerm]); 

  const sortableTable = <SortableTable
    headCells={columns}
    rows={rows}
    defaultSort={columns[0].id}
    cellAlignment={'left'}/>;

  return isLoading ? spinner : sortableTable;
}