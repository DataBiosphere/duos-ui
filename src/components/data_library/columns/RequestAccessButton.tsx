import React from 'react'
import { Button, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { applyForAccess } from 'src/utils/accessUtils'
import { Storage } from 'src/libs/storage'

interface RequestAccessButtonProps {
  datasetId: number
}

export const RequestAccessButton: React.FC<RequestAccessButtonProps> = ({ datasetId }) => {
  const navigate = useNavigate()
  const hasLibraryCard = Storage.getCurrentUser()?.libraryCard != null

  return (
    <Tooltip title={hasLibraryCard ? '' : 'A Library Card is required to apply for data access'}>
      <span>
        <Button
          variant="contained"
          size="small"
          onClick={() => applyForAccess([datasetId], navigate)}
          sx={{ fontWeight: 600, fontSize: '12px' }}
          disabled={!hasLibraryCard}
        >
          Request Now
        </Button>
      </span>
    </Tooltip>
  )
}

export default RequestAccessButton
