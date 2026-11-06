import React from 'react'
import { Stack } from '@mui/material'
import DarSummaryCard from 'src/components/DarSummaryCard'
import DarTrends from 'src/components/dar_analytics/DarTrends'
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
  // Counted only once there is a list to count; a failed load is not zero requests.
  const counted = !isPending && !restricted && (data.length > 0 || !error)
  return (
    <>
      <StudyPageSection
        id="dar-history"
        heading="Data Access Requests for this Study"
        headingDetail={counted ? `(${data.length})` : undefined}
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
      {/* Always mounted, since the table of contents lists sections in the order they first
          render. The reports wait on the history's answer: they are read under the same access
          rule, so a refusal there would only repeat the notice above as four failed reports. */}
      <StudyPageSection id="dar-trends" heading="Data Access Request Trends">
        {!isPending && !restricted && <DarTrends subject={{ type: 'study', id: studyId }} />}
        {restricted && (
          <output style={{ display: 'block', fontStyle: 'italic' }}>
            Trends are shown to those who can see this study&apos;s data access request history.
          </output>
        )}
      </StudyPageSection>
    </>
  )
}

export default StudyDarHistory
