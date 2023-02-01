import React, {useState} from 'react';
import {DAC} from '../../libs/ajax';
import {Link} from 'react-router-dom';
import {isNil} from 'lodash/fp';
import Button from '@mui/material/Button';
import style from '../../pages/DACDatasets.module.css';

export default function DACDatasetApprovalStatus(props) {

  const [dataset, setDataset] = useState(props.dataset);

  const updateApprovalStatus = async (approvalState) => {
    const updatedDataset = await DAC.updateApprovalStatus(dataset.dacId, dataset.dataSetId, approvalState);
    setDataset(updatedDataset);
  };

  const dacAccepted = (dataset) => <div
    style={{color: '#1ea371', fontWeight: 'bold'}}>
    <span>ACCEPTED</span>
    <Link
      style={{marginLeft: '15px'}}
      id={`${dataset.dataSetId}_edit`}
      className={'glyphicon glyphicon-pencil'}
      to={`dataset_registration/${dataset.dataSetId}`}
    />
  </div>;

  const dacRejected = () => <div
    style={{color: '#000000', fontWeight: 'bold'}}>
    <span>REJECTED</span>
  </div>;

  const dacUndecided = () => <div style={{display: 'flex', alignItems: 'center'}}>
    <Button
      id={'btn_approveDataset'}
      onClick={() => updateApprovalStatus(true)}
      className={style['btn-primary-dac-datasets']}>
      YES
    </Button>
    <Button
      id={'btn_approveDataset'}
      onClick={() => updateApprovalStatus(false)}
      className={style['btn-primary-dac-datasets']}>
      NO
    </Button>
  </div>;

  return (!isNil(dataset?.dacApproval))
    ? dataset.dacApproval
      ? dacAccepted(dataset)
      : dacRejected()
    : dacUndecided();
}
