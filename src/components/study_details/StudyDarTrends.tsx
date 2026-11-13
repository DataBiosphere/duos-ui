import React, { useMemo } from 'react'
import { CircularProgress, Typography } from '@mui/material'
import { DarTrends } from 'src/components/dar_analytics/DarTrends'
import { useStudyDarHistory } from 'src/hooks/useStudyDetailsData'
import { DarMetricsTarget } from 'src/types/darMetrics'
import { extractStatus } from 'src/utils/ErrorUtils'
import StudyPageSection from './StudyPageSection'

/**
 * The study's DAR trends, for whoever can read its DAR history. Consent gates both the same way,
 * so the history request, which the section above already makes, answers whether to ask for the
 * trends at all. They are shown and requested only while the history's last settled answer is a
 * success: never once it has been refused, and never once it has failed, even where the section
 * above keeps an earlier history on the page. A cached history counts until its refetch settles,
 * so returning to a study doesn't wait on a new request; consent still checks every report.
 *
 * The heading stays up in every state, so the table of contents keeps its place. The notes are
 * plain text, not alerts: a refusal or a first failure is announced by the history section, and
 * announcing it here too would say it twice.
 */
const StudyDarTrends = ({ studyId }: { studyId: string }) => {
  const { data, isPending, error } = useStudyDarHistory(studyId)
  const target = useMemo<DarMetricsTarget>(() => ({ kind: 'study', id: studyId }), [studyId])

  const content = () => {
    if (isPending) {
      return <CircularProgress size={24} />
    }
    if (extractStatus(error) === 403) {
      return (
        <Typography color="text.secondary">
          Trends are shown to those who can see this study&apos;s data access request history.
        </Typography>
      )
    }
    if (error || !data) {
      return (
        <Typography color="text.secondary">
          Trends are unavailable because this study&apos;s data access request history could not be
          loaded just now.
        </Typography>
      )
    }
    return <DarTrends target={target} />
  }

  return (
    <StudyPageSection id="dar-trends" heading="Data Access Request Trends">
      {content()}
    </StudyPageSection>
  )
}

export default StudyDarTrends
