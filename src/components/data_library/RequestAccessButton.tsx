import React from 'react'
import { Button, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router'
import { applyForAccess } from 'src/utils/accessUtils'
import { ACTIVE_RESEARCHER_STATUS_REQUIRED, hasActiveResearcherStatus } from 'src/hooks/useApplyForAccessEligibility'

interface RequestAccessButtonProps {
  datasetId: number
  /** When datasets are selected elsewhere on the page, single-dataset requests
   *  are disabled so the footer's 'Apply for Access' is the only request path. */
  disabledForSelection?: boolean
  /** The DAC has not approved this dataset, so there is nothing to request yet. The study page
   *  and the submissions view list these rows; the library does not. */
  awaitingDacApproval?: boolean
}

export const RequestAccessButton: React.FC<RequestAccessButtonProps> = ({
  datasetId,
  disabledForSelection = false,
  awaitingDacApproval = false,
}) => {
  const navigate = useNavigate()
  const isActiveResearcher = hasActiveResearcherStatus()

  // Ordered by how fundamental the reason is: an unapproved dataset cannot be requested by
  // anyone, whatever else is true of the page or the reader.
  let tooltip = ''
  if (awaitingDacApproval) {
    tooltip = 'This dataset is awaiting DAC approval'
  }
  else if (disabledForSelection) {
    tooltip = 'Use \'Apply for Access\' below to request the selected datasets'
  }
  else if (!isActiveResearcher) {
    tooltip = ACTIVE_RESEARCHER_STATUS_REQUIRED
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <Button
          variant="contained"
          size="small"
          onClick={() => applyForAccess([datasetId], navigate)}
          sx={{ fontWeight: 600, fontSize: '12px' }}
          disabled={awaitingDacApproval || disabledForSelection || !isActiveResearcher}
        >
          Request Now
        </Button>
      </span>
    </Tooltip>
  )
}

export default RequestAccessButton
