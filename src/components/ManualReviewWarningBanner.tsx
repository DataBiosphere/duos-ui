import React from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import { DataAccessRequestData } from 'src/types/model'
import { manualReviewDataUseTerms } from 'src/libs/dataUseTranslation'
import { isEmpty } from 'src/utils/NodashUtil'

interface ManualReviewWarningBannerProps {
  darInfo?: Partial<DataAccessRequestData>
}

/**
 * Surfaces every data use term that requires manual review. The terms are also shown in the
 * review header, but that list is scrollable, so this banner guarantees they are never hidden.
 */
export const ManualReviewWarningBanner = ({ darInfo }: ManualReviewWarningBannerProps) => {
  const terms = manualReviewDataUseTerms(darInfo)

  if (isEmpty(terms)) return null

  const summary = terms.length === 1
    ? 'This Data Access Request includes a data use term that requires manual review.'
    : `This Data Access Request includes ${terms.length} data use terms that require manual review.`

  return (
    <Alert severity="warning" data-cy="manual-review-warning-banner" sx={{ my: 1 }}>
      <AlertTitle>{summary}</AlertTitle>
      Please carefully review this request for compliance and ethical considerations before granting approval.
      {/* Descriptions only: most manual-review modifiers share the OTHER code, and the header's
          DUO terms box already shows the code on each term's badge. */}
      <ul data-cy="manual-review-term-list" style={{ margin: '0.5rem 0 0', paddingLeft: '2rem' }}>
        {terms.map((term, index) => (
          <li key={`manual-review-${term.code}-${index}`}>{term.description}</li>
        ))}
      </ul>
    </Alert>
  )
}

export default ManualReviewWarningBanner
