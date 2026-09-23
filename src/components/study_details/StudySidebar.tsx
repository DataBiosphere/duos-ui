import React from 'react'
import { Box, Button, Divider, Tooltip, Typography } from '@mui/material'
import { useApplyForAccessEligibility } from 'src/hooks/useApplyForAccessEligibility'

interface Props extends React.PropsWithChildren {
  selectedDatasetIds: number[]
  selectedStudyIds: number[]
  onApplyForAccess: () => void
}

/**
 * The wide-viewport counterpart to LibraryFooter. Both request paths share
 * `useApplyForAccessEligibility`, so the Active Researcher Status guard can't hold on one
 * viewport and not the other.
 */
const StudySidebar = ({ selectedDatasetIds, selectedStudyIds, onApplyForAccess, children }: Props) => {
  const { hasSelection, hasActiveResearcherStatus, datasetText, studyText }
    = useApplyForAccessEligibility(selectedDatasetIds, selectedStudyIds)

  return (
    <Box component="aside" sx={{ position: 'sticky', top: 24, width: 280, p: 3, borderLeft: '1px solid #ddd' }}>
      {children}
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2">
        {selectedDatasetIds.length} {datasetText} selected from {selectedStudyIds.length} {studyText}
      </Typography>
      <Tooltip
        title={hasActiveResearcherStatus ? '' : 'Active Researcher Status is required to apply for data access'}
        slotProps={{ tooltip: { sx: { backgroundColor: 'red', color: 'white' } } }}
      >
        {/* A disabled button fires no events, so the tooltip needs a wrapper to hang off;
            it has to be block-level or it shrink-wraps and `fullWidth` has nothing to fill. */}
        <Box component="span" sx={{ display: 'block' }}>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 2 }}
            disabled={!hasSelection || !hasActiveResearcherStatus}
            onClick={onApplyForAccess}
          >
            Apply for Access
          </Button>
        </Box>
      </Tooltip>
    </Box>
  )
}

export default StudySidebar
