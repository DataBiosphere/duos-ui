import React from 'react'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { descriptionStyle, headingStyle } from 'src/components/dashboard/dashboardStyles'
import { extractError } from 'src/utils/ErrorUtils'

interface AnalyticsSectionProps {
  title: string
  description?: React.ReactNode
  /** Shown beside the figures they qualify, whatever state the section is in. */
  caveats?: string[]
  isLoading: boolean
  /** Showing the previous range's figures while the new one loads. */
  isRefreshing?: boolean
  error?: unknown
  /** Offered beside the error, for failures a range change would not clear, such as a later page. */
  onRetry?: () => void
  isEmpty: boolean
  emptyText: string
  children: React.ReactNode
}

export const AnalyticsSection = ({
  title, description, caveats = [], isLoading, isRefreshing = false, error, onRetry, isEmpty, emptyText, children,
}: AnalyticsSectionProps) => {
  const headingId = `${title.toLowerCase().replaceAll(/\W+/g, '-')}-heading`

  const content = () => (isEmpty ? <Typography sx={descriptionStyle}>{emptyText}</Typography> : children)
  // A failed report shows at once, even while another is still loading.
  const body = () => {
    if (error) {
      const retry = onRetry && <Button color="inherit" size="small" onClick={onRetry}>Try again</Button>
      return <Alert severity="error" action={retry}>Unable to load {title}: {extractError(error)}</Alert>
    }
    return isLoading
      ? <CircularProgress aria-label={`Loading ${title}`} />
      : <Box aria-busy={isRefreshing} sx={{ opacity: isRefreshing ? 0.5 : 1 }}>{content()}</Box>
  }

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography component="h2" id={headingId} sx={{ ...headingStyle, maxWidth: 'none', mt: '2rem' }}>{title}</Typography>
      {description && <Typography sx={{ ...descriptionStyle, mb: '1rem' }}>{description}</Typography>}
      {caveats.map(caveat => <Alert key={caveat} severity="info" sx={{ mb: '1rem' }}>{caveat}</Alert>)}
      {body()}
    </Box>
  )
}
