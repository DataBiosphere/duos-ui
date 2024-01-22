import React, {useState} from 'react';
import {DAC} from '../../libs/ajax';
import {Link} from 'react-router-dom';
import {isNil} from 'lodash/fp';
import Button from '@mui/material/Button';
import ReactTooltip from 'react-tooltip';
import style from '../../pages/DACDatasets.module.css';
import { ConfirmationDialog } from '../modals/ConfirmationDialog';
import IconButton from '@mui/material/IconButton';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

export default function DACDatasetApprovalStatus(props) {

  const [dataset, setDataset] = useState(props.dataset);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const updateApprovalStatus = async (approvalState) => {
    const updatedDataset = await DAC.updateApprovalStatus(dataset.dacId, dataset.dataSetId, approvalState);
    setDataset(updatedDataset);
  };

  const dacAccepted = (dataset) => <div style={{color: '#1ea371', fontWeight: 'bold'}}>
    <span>ACCEPTED</span>
    <Link
      style={{marginLeft: '15px'}}
      id={`${dataset.dataSetId}_edit`}
      className={'glyphicon glyphicon-pencil'}
      to={dataset.study?.studyId === undefined ? `dataset_registration/${dataset.dataSetId}` : `study_update/${dataset.study.studyId}`}
    />
    <Link
      style={{marginLeft: '15px'}}
      id={`${dataset.dataSetId}_delete`}
      className={'glyphicon glyphicon-trash'}
      onClick={handleClick}
      to={`#`}
    />
    <ConfirmationDialog title="Delete dataset" open={open} close={handleClose} description={`Are you sure you want to delete the dataset named '${dataset.name}'?`} />
  </div>;

  const dacRejected = () => <div style={{color: '#000000', fontWeight: 'bold'}}>
    <span>REJECTED</span>
  </div>;

  const dacUndecided = (dataset) => <div style={{display: 'flex', alignItems: 'center'}}>
    <Button
      data-tip={true}
      data-for={`approve-dataset-button-${dataset.dataSetId}`}
      id={`btn_approveDataset-${dataset.dataSetId}`}
      onClick={() => updateApprovalStatus(true)}
      className={style['btn-primary-dac-datasets']}>
      YES
    </Button>
    <ReactTooltip
      place={'left'}
      effect={'solid'}
      id={`approve-dataset-button-${dataset.dataSetId}`}>Approve dataset for Data Access Committee</ReactTooltip>
    <Button
      data-tip={true}
      data-for={`reject-dataset-button-${dataset.dataSetId}`}
      id={`btn_rejectDataset-${dataset.dataSetId}`}
      onClick={() => updateApprovalStatus(false)}
      className={style['btn-primary-dac-datasets']}>
      NO
    </Button>
    <ReactTooltip
      place={'right'}
      effect={'solid'}
      id={`reject-dataset-button-${dataset.dataSetId}`}>Reject dataset for Data Access Committee</ReactTooltip>
  </div>;

  return (!isNil(dataset?.dacApproval))
    ? dataset.dacApproval
      ? dacAccepted(dataset)
      : dacRejected()
    : dacUndecided(dataset);
}
