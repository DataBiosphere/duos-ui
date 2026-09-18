import React from 'react'
import { Button, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router'
import { applyForAccess } from 'src/utils/accessUtils'
import { ACTIVE_RESEARCHER_STATUS_REQUIRED, hasActiveResearcherStatus } from 'src/hooks/useApplyForAccessEligibility'
import { getApprovalStatus } from 'src/libs/utils'

interface RequestAccessButtonProps {
  datasetId: number
  /** When datasets are selected elsewhere on the page, single-dataset requests
   *  are disabled so the footer's 'Apply for Access' is the only request path. */
  disabledForSelection?: boolean
  /** The DAC's decision, as stored: true approved, false rejected, absent still pending. Passed
   *  raw rather than as a flag so the button can say which of the two it is. The study page and
   *  the submissions view list unapproved rows; the library does not. */
  dacApproval?: boolean | null
}

export const RequestAccessButton: React.FC<RequestAccessButtonProps> = ({
  datasetId,
  disabledForSelection = false,
  dacApproval,
}) => {
  const navigate = useNavigate()
  const isActiveResearcher = hasActiveResearcherStatus()
  // The same vocabulary the submissions Status chip uses, so the button cannot call a dataset
  // 'awaiting approval' while the chip beside it reads 'Rejected'.
  const approvalStatus = getApprovalStatus(dacApproval, 'pending')
  const unapproved = approvalStatus !== 'accepted'

  // Ordered by how fundamental the reason is: an unapproved dataset cannot be requested by
  // anyone, whatever else is true of the page or the reader.
  let tooltip = ''
  if (unapproved) {
    tooltip = approvalStatus === 'rejected'
      ? 'The DAC has rejected this dataset'
      : 'This dataset is awaiting DAC approval'
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
          disabled={unapproved || disabledForSelection || !isActiveResearcher}
        >
          Request Now
        </Button>
      </span>
    </Tooltip>
  )
}

export default RequestAccessButton
