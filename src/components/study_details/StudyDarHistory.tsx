import React, { useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useStudyDarHistory } from 'src/hooks/useStudyDetailsData'
import { DatasetStatisticsDar } from 'src/types/model'
import { extractStatus } from 'src/utils/ErrorUtils'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

const DarCard = ({ dar }: { dar: DatasetStatisticsDar }) => {
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
      {dar.nonTechRus && (
        <>
          <Button
            size="small"
            sx={{ mt: 1, px: 0 }}
            onClick={() => setExpanded(value => !value)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide research use statement' : 'Show research use statement'}
          </Button>
          {expanded && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{dar.nonTechRus}</Typography>}
        </>
      )}
    </Paper>
  )
}

const StudyDarHistory = ({ studyId }: { studyId: string }) => {
  const { data = [], isPending, error } = useStudyDarHistory(studyId)
  // The same refusal the dataset page distinguishes. Without this branch a 403 read as "unable to
  // load", so the two surfaces described one authorization decision in two different ways - which
  // is the reason extractStatus exists.
  const restricted = extractStatus(error) === 403
  return (
    <StudyPageSection id="dar-history" heading="Data Access Requests for this Study">
      <StudyQueryResult
        isPending={isPending}
        // A refusal still blocks: once the server says no, cached request history should come off
        // the page rather than linger. Any other failure defers to what is already loaded, as the
        // other sections do - a transient refetch error is not a reason to discard correct rows.
        error={restricted || data.length > 0 ? undefined : error}
        isEmpty={!restricted && data.length === 0}
        emptyMessage="No granted data access requests yet."
        errorMessage="Unable to load data access requests."
      >
        {restricted
          ? (
              <output style={{ display: 'block', fontStyle: 'italic' }}>
                You do not have access to this study&apos;s data access request history. While a
                study is unpublished its history is visible only to the study&apos;s creator, its
                custodians, and admins.
              </output>
            )
          : (
              <Stack spacing={2}>
                {data.map(dar => <DarCard key={dar.referenceId} dar={dar} />)}
              </Stack>
            )}
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyDarHistory
