import React, {useState} from 'react';
import { DataSet } from '../../libs/ajax/DataSet';
import { DAC } from '../../libs/ajax/DAC';
import {Link} from 'react-router-dom';
import {isNil} from 'lodash/fp';
import Button from '@mui/material/Button';
import ReactTooltip from 'react-tooltip';
import style from '../../pages/DACDatasets.module.css';
import { ConfirmationDialog } from '../modals/ConfirmationDialog';
import { Notifications } from '../../libs/utils';

export default function DACDatasetApprovalStatus(props) {

  const [dataset, setDataset] = useState(props.dataset);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAction = ({datasetId, name}) => {
    setOpen(false);
    try {
      DataSet.deleteDataset(datasetId).then(() => {
        Notifications.showSuccess({
          text: `Deleted dataset '${name}' successfully.`,
        });
        props.history.push('/chair_console');
      });
    } catch {
      Notifications.showError({text: `Error deleting dataset '${name}'`});
    }
  };

  const updateApprovalStatus = async (approvalState) => {
    const updatedDataset = await DAC.updateApprovalStatus(dataset.dacId, dataset.datasetId, approvalState);
    setDataset(updatedDataset);
  };

  const dacAccepted = (dataset) => <div style={{color: '#1ea371', fontWeight: 'bold'}}>
    <span>ACCEPTED</span>
    {dataset.study?.studyId &&
      <Link
        style={{marginLeft: '15px'}}
        id={`${dataset.datasetId}_edit`}
        className={'glyphicon glyphicon-pencil'}
        to={`study_update/${dataset.study.studyId}`}
      />
    }
    {dataset.deletable &&
      <>
        <Link
          style={{marginLeft: '15px'}}
          id={`${dataset.datasetId}_delete`}
          className={'glyphicon glyphicon-trash'}
          onClick={handleClick}
          to={`#`}
        />
        <ConfirmationDialog title="Delete dataset" openState={open} close={handleClose} action={() => handleAction(dataset)} description={`Are you sure you want to delete the dataset named '${dataset.name}'?`} />
      </>
    }
  </div>;

  const dacRejected = () => <div style={{color: '#000000', fontWeight: 'bold'}}>
    <span>REJECTED</span>
  </div>;

  const dacUndecided = (dataset) => <div style={{display: 'flex', alignItems: 'center'}}>
    <Button
      data-tip={true}
      data-for={`approve-dataset-button-${dataset.datasetId}`}
      id={`btn_approveDataset-${dataset.datasetId}`}
      onClick={() => updateApprovalStatus(true)}
      className={style['btn-primary-dac-datasets']}>
      YES
    </Button>
    <ReactTooltip
      place={'left'}
      effect={'solid'}
      id={`approve-dataset-button-${dataset.datasetId}`}>Approve dataset for Data Access Committee</ReactTooltip>
    <Button
      data-tip={true}
      data-for={`reject-dataset-button-${dataset.datasetId}`}
      id={`btn_rejectDataset-${dataset.datasetId}`}
      onClick={() => updateApprovalStatus(false)}
      className={style['btn-primary-dac-datasets']}>
      NO
    </Button>
    <ReactTooltip
      place={'right'}
      effect={'solid'}
      id={`reject-dataset-button-${dataset.datasetId}`}>Reject dataset for Data Access Committee</ReactTooltip>
  </div>;

  return (!isNil(dataset?.dacApproval))
    ? dataset.dacApproval
      ? dacAccepted(dataset)
      : dacRejected()
    : dacUndecided(dataset);
}
