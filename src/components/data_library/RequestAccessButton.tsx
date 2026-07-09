import React from 'react'
import { Button, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { applyForAccess } from 'src/utils/accessUtils'
import { Storage } from 'src/libs/storage'

interface RequestAccessButtonProps {
  datasetId: number
  /** When datasets are selected elsewhere on the page, single-dataset requests
   *  are disabled so the footer's 'Apply for Access' is the only request path. */
  disabledForSelection?: boolean
}

export const RequestAccessButton: React.FC<RequestAccessButtonProps> = ({ datasetId, disabledForSelection = false }) => {
  const navigate = useNavigate()
  const hasLibraryCard = Storage.getCurrentUser()?.libraryCard != null

  let tooltip = ''
  if (disabledForSelection) {
    tooltip = 'Use \'Apply for Access\' below to request the selected datasets'
  }
  else if (!hasLibraryCard) {
    tooltip = 'A Library Card is required to apply for data access'
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <Button
          variant="contained"
          size="small"
          onClick={() => applyForAccess([datasetId], navigate)}
          sx={{ fontWeight: 600, fontSize: '12px' }}
          disabled={disabledForSelection || !hasLibraryCard}
        >
          Request Now
        </Button>
      </span>
    </Tooltip>
  )
}

export default RequestAccessButton
