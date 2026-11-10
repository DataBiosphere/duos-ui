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

interface LifecycleDate {
  label: string
  date: number
}

// Consent's dates are external data. One it leaves out, or sends as anything a Date can't hold, is
// left off the card rather than shown as "Invalid Date".
const isDate = (value: unknown): value is number =>
  typeof value === 'number' && !Number.isNaN(new Date(value).getTime())

/** A closeout ends access before its term runs out, so its date stands in for the expiration. */
const accessEnd = (dar: DatasetStatisticsDar): { label: string, date: unknown } =>
  isDate(dar.closeoutDate)
    ? { label: 'Closed out', date: dar.closeoutDate }
    : { label: dar.expired ? 'Expired' : 'Expires', date: dar.expirationDate }

/** The dates consent sent, in the order they happened. */
const lifecycleDates = (dar: DatasetStatisticsDar): LifecycleDate[] => {
  const renewals: unknown[] = Array.isArray(dar.progressReportApprovalDates) ? dar.progressReportApprovalDates : []
  return [
    { label: 'Submitted', date: dar.submissionDate },
    { label: 'Approved', date: dar.approvalDate },
    ...renewals.map(date => ({ label: 'Renewed', date })),
    accessEnd(dar),
  ].filter((entry): entry is LifecycleDate => isDate(entry.date))
}

const statusOf = (dar: DatasetStatisticsDar): { label: string, color: 'default' | 'success' } => {
  if (isDate(dar.closeoutDate)) {
    return { label: 'Closed out', color: 'default' }
  }
  return dar.expired ? { label: 'Expired', color: 'default' } : { label: 'Current', color: 'success' }
}

const DarSummaryCard = ({ dar }: { dar: DatasetStatisticsDar }) => {
  const [expanded, setExpanded] = useState(false)
  const dates = lifecycleDates(dar)
  const status = statusOf(dar)

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {dar.projectTitle || 'Untitled project'}
          </Typography>
          {/* Institution, not the requester's name: the section says where a grant went. */}
          <Typography variant="body2">Institution: {dar.institutionName || 'Not provided'}</Typography>
          {dates.length > 0 && (
            <Box
              component="dl"
              sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 1.5, m: 0, mt: 0.5 }}
            >
              {dates.map(({ label, date }, index) => (
                // Renewals repeat their label and can share a date, so only the position is unique.
                <React.Fragment key={index}>
                  <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
                  <Typography component="dd" variant="caption" color="text.secondary" sx={{ m: 0 }}>
                    {new Date(date).toLocaleDateString()}
                  </Typography>
                </React.Fragment>
              ))}
            </Box>
          )}
        </Box>
        <Chip size="small" color={status.color} label={status.label} sx={{ flexShrink: 0 }} />
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
