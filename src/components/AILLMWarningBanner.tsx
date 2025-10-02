import React from 'react'
import WarningIcon from '@mui/icons-material/Warning'
import { DataAccessRequestData } from 'src/types/model'

const styles = {
  warningBanner: {
    backgroundColor: '#FFF3CD',
    border: '2px solid #FF6B35',
    borderRadius: '8px',
    padding: '1rem',
    margin: '1rem 0',
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '1rem',
    fontFamily: 'Montserrat',
  },
  warningIcon: {
    color: '#FF6B35',
    fontSize: '2.5rem',
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
}

interface AILLMWarningBannerProps {
  darInfo?: Partial<DataAccessRequestData>
}

export const AILLMWarningBanner = ({ darInfo }: AILLMWarningBannerProps) => {
  const hasAILLMUse = darInfo?.aiLlmUse === true

  return (
    hasAILLMUse && (
      <div style={styles.warningBanner} data-cy="ai-llm-warning-banner">
        <WarningIcon style={styles.warningIcon} />
        <div style={styles.warningContent}>
          <p style={styles.warningMessage}>
            This Data Access Request involves Artificial Intelligence (AI) or Large Language Model (LLM) research.
            Please carefully review this request for compliance and ethical considerations before granting approval.
          </p>
        </div>
      </div>
    )
  )
}

export default AILLMWarningBanner
