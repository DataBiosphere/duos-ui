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

const formatDate = (date: number) => new Date(date).toLocaleDateString()

/**
 * Submission, approval, each renewal, and how access ends, in the order they happen. A closeout
 * ends access early, so a closed-out DAR shows its closeout in place of an expiration.
 */
const darTimeline = (dar: DatasetStatisticsDar): string[] => {
  let accessEnd: string[] = []
  if (dar.closeoutDate) {
    accessEnd = [`Closed out ${formatDate(dar.closeoutDate)}`]
  }
  else if (dar.expirationDate) {
    accessEnd = [`${dar.expired ? 'Expired' : 'Expires'} ${formatDate(dar.expirationDate)}`]
  }
  return [
    `Submitted ${dar.submissionDate ? formatDate(dar.submissionDate) : 'date not available'}`,
    ...(dar.approvalDate ? [`Approved ${formatDate(dar.approvalDate)}`] : []),
    ...(dar.progressReportApprovalDates?.length
      ? [`Renewed ${dar.progressReportApprovalDates.map(formatDate).join(', ')}`]
      : []),
    ...accessEnd,
  ]
}

const accessStatus = (dar: DatasetStatisticsDar): { label: string, color: 'default' | 'success' } => {
  if (dar.closeoutDate) return { label: 'Closed out', color: 'default' }
  return dar.expired ? { label: 'Expired', color: 'default' } : { label: 'Current', color: 'success' }
}

const DarSummaryCard = ({ dar }: { dar: DatasetStatisticsDar }) => {
  const [expanded, setExpanded] = useState(false)
  const status = accessStatus(dar)

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {dar.projectTitle || 'Untitled project'}
          </Typography>
          {/* Institution, not the requester's name: the section says where a grant went. */}
          <Typography variant="body2">Institution: {dar.institutionName || 'Not provided'}</Typography>
          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {darTimeline(dar).map(event => (
              <Typography key={event} component="li" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {event}
              </Typography>
            ))}
          </Box>
        </Box>
        <Chip size="small" color={status.color} label={status.label} />
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
