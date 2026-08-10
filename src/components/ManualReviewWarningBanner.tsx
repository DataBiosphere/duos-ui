import React from 'react'
import WarningIcon from '@mui/icons-material/Warning'
import { DataAccessRequestData } from 'src/types/model'
import { manualReviewDataUseTerms } from 'src/libs/dataUseTranslation'
import { isEmpty } from 'src/utils/NodashUtil'

const styles = {
  warningBanner: {
    backgroundColor: '#FFF3CD',
    border: '2px solid #FF6B35',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0',
    display: 'flex' as const,
    alignItems: 'flex-start' as const,
    gap: '1rem',
    fontFamily: 'Montserrat',
  },
  warningIcon: {
    color: '#FF6B35',
    fontSize: '2.5rem',
    flexShrink: 0,
  },
  warningContent: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  warningMessage: {
    fontSize: '1.4rem',
    color: '#333F52',
    margin: 0,
  },
  termList: {
    margin: 0,
    paddingLeft: '2rem',
    fontSize: '1.4rem',
    color: '#333F52',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '0.4rem',
  },
}

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
    <div style={styles.warningBanner} data-cy="manual-review-warning-banner">
      <WarningIcon style={styles.warningIcon} />
      <div style={styles.warningContent}>
        <p style={styles.warningMessage}>
          {summary}
          {' '}
          Please carefully review this request for compliance and ethical considerations before granting approval.
        </p>
        <ul style={styles.termList} data-cy="manual-review-term-list">
          {terms.map((term, index) => (
            // Descriptions only: most manual-review modifiers share the OTHER code, and the
            // header's DUO terms box already shows the code on each term's badge.
            <li key={`manual-review-${term.code}-${index}`}>{term.description}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ManualReviewWarningBanner
