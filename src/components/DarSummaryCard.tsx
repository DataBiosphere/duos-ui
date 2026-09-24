import React, { useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { DatasetStatisticsDar } from 'src/types/model'

/*
 * One granted data access request, as the study and dataset pages both show it. Shared so the two
 * pages cannot drift apart in how they present the same grant.
 */
const DarText = ({ label, text }: { label: string, text: string }) => (
  <Box>
    <Typography variant="body2" sx={{ fontWeight: 600 }}>{label}</Typography>
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{text}</Typography>
  </Box>
)

const DarSummaryCard = ({ dar }: { dar: DatasetStatisticsDar }) => {
  const [expanded, setExpanded] = useState(false)
  const submissionDate = dar.submissionDate
    ? new Date(dar.submissionDate).toLocaleDateString()
    : 'date not available'

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {dar.projectTitle || 'Untitled project'}
          </Typography>
          {/* Institution, not the requester's name: the section says where a grant went. */}
          <Typography variant="body2">Institution: {dar.institutionName || 'Not provided'}</Typography>
          <Typography variant="caption" color="text.secondary">Submitted {submissionDate}</Typography>
        </Box>
        <Chip
          size="small"
          color={dar.expired ? 'default' : 'success'}
          label={dar.expired ? 'Expired' : 'Current'}
        />
      </Stack>
      {(dar.rus || dar.nonTechRus) && (
        <>
          <Button
            size="small"
            sx={{ mt: 1, px: 0 }}
            onClick={() => setExpanded(value => !value)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide research use statement and summary' : 'Show research use statement and summary'}
          </Button>
          {expanded && (
            <Stack spacing={1}>
              {dar.rus && <DarText label="Research Use Statement" text={dar.rus} />}
              {dar.nonTechRus && <DarText label="Non-Technical Summary" text={dar.nonTechRus} />}
            </Stack>
          )}
        </>
      )}
    </Paper>
  )
}

export default DarSummaryCard
