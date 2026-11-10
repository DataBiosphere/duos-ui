import React from 'react'
import { Stack } from '@mui/material'
import DarSummaryCard from 'src/components/DarSummaryCard'
import { useStudyDarHistory } from 'src/hooks/useStudyDetailsData'
import { extractStatus } from 'src/utils/ErrorUtils'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

const StudyDarHistory = ({ studyId }: { studyId: string }) => {
  const { data = [], isPending, error } = useStudyDarHistory(studyId)
  // The same refusal the dataset page distinguishes. Without this branch a 403 read as "unable to
  // load", so the two surfaces described one authorization decision in two different ways - which
  // is the reason extractStatus exists.
  const restricted = extractStatus(error) === 403
  // Counted only when the requests themselves are on the page, so a refusal or a failed load never
  // reads as "(0)". A study with no requests has loaded, and does.
  const listed = !isPending && !restricted && (!error || data.length > 0)
  return (
    <StudyPageSection
      id="dar-history"
      heading="Data Access Requests for this Study"
      count={listed ? data.length : undefined}
    >
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
                {data.map(dar => <DarSummaryCard key={dar.referenceId} dar={dar} />)}
              </Stack>
            )}
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyDarHistory
