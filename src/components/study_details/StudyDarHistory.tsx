import React, { useState } from 'react'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import { useStudyDarHistory } from 'src/hooks/useStudyDetailsData'
import { DatasetStatisticsDar } from 'src/types/model'
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
          <Typography variant="body2">PI: {dar.piName || 'Not provided'}</Typography>
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
  return (
    <StudyPageSection id="dar-history" heading="Data Access Requests for this Study">
      <StudyQueryResult
        isPending={isPending}
        error={error}
        isEmpty={data.length === 0}
        emptyMessage="No granted data access requests yet."
        errorMessage="Unable to load data access requests."
      >
        <Stack spacing={2}>
          {data.map(dar => <DarCard key={dar.referenceId} dar={dar} />)}
        </Stack>
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyDarHistory
