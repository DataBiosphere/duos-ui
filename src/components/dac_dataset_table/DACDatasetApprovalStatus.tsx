import React, { useState } from 'react'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DAC } from 'src/libs/ajax/DAC'
import { Link, useNavigate } from 'react-router'
import { isNil } from 'src/utils/NodashUtil'
import Button from '@mui/material/Button'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import style from 'src/pages/DACDatasets.module.css'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { Notifications } from 'src/libs/utils'
import { DatasetTerm } from 'src/types/model'

interface DACDatasetApprovalStatusProps {
  dataset: DatasetTerm
}

export default function DACDatasetApprovalStatus({ dataset: initialDataset }: DACDatasetApprovalStatusProps) {
  const navigate = useNavigate()
  const [dataset, setDataset] = useState<DatasetTerm>(initialDataset)
  const [open, setOpen] = useState(false)

  const handleClick = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleAction = async ({ datasetId, datasetName }: Pick<DatasetTerm, 'datasetId' | 'datasetName'>) => {
    setOpen(false)
    try {
      await DataSet.deleteDataset(datasetId)
      Notifications.showSuccess({ text: `Deleted dataset '${datasetName}' successfully.` })
      navigate('/dac_console_dar_requests')
    }
    catch {
      Notifications.showError({ text: `Error deleting dataset '${datasetName}'` })
    }
  }

  const updateApprovalStatus = async (approvalState: boolean): Promise<void> => {
    const updated = await DAC.updateApprovalStatus(dataset.dacId, dataset.datasetId, approvalState)
    setDataset(prev => ({ ...prev, dacApproval: updated.dacApproval ?? prev.dacApproval }))
  }

  const dacAccepted = (ds: DatasetTerm) => (
    <div style={{ color: '#1ea371', fontWeight: 'bold' }}>
      <span>ACCEPTED</span>
      {!!ds.study?.studyId
        && (
          <Link
            style={{ marginLeft: '15px' }}
            id={`${ds.datasetId}_edit`}
            className="glyphicon glyphicon-pencil"
            to={`/study_update/${ds.study.studyId}`}
          />
        )}
      {ds.deletable
        && (
          <>
            <Link
              style={{ marginLeft: '15px' }}
              id={`${ds.datasetId}_delete`}
              className="glyphicon glyphicon-trash"
              onClick={handleClick}
              to="#"
            />
            <ConfirmationDialog
              title="Delete dataset"
              openState={open}
              close={handleClose}
              action={() => handleAction(ds)}
              description={`Are you sure you want to delete the dataset named '${ds.datasetName}'?`}
            />
          </>
        )}
    </div>
  )

  const dacRejected = () => (
    <div style={{ color: '#000000', fontWeight: 'bold' }}>
      <span>REJECTED</span>
    </div>
  )

  const dacUndecided = (ds: DatasetTerm) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button
        data-tip={true}
        data-for={`approve-dataset-button-${ds.datasetId}`}
        id={`btn_approveDataset-${ds.datasetId}`}
        onClick={() => { void updateApprovalStatus(true) }}
        className={style['btn-primary-dac-datasets']}
        style={{ minWidth: '90px' }}
      >
        APPROVE
      </Button>
      <ReactTooltip
        place="left"
        id={`approve-dataset-button-${ds.datasetId}`}
      >
        Approve dataset for Data Access Committee
      </ReactTooltip>
      <Button
        data-tip={true}
        data-for={`reject-dataset-button-${ds.datasetId}`}
        id={`btn_rejectDataset-${ds.datasetId}`}
        onClick={() => { void updateApprovalStatus(false) }}
        className={style['btn-primary-dac-datasets']}
        style={{ minWidth: '70px' }}
      >
        REJECT
      </Button>
      <ReactTooltip
        place="right"
        id={`reject-dataset-button-${ds.datasetId}`}
      >
        Reject dataset for Data Access Committee
      </ReactTooltip>
    </div>
  )

  if (isNil(dataset?.dacApproval)) return dacUndecided(dataset)
  return dataset.dacApproval ? dacAccepted(dataset) : dacRejected()
}
