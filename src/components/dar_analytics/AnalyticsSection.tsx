import React from 'react'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { descriptionStyle, headingStyle } from 'src/components/dashboard/dashboardStyles'
import { useDarMetricsTarget } from 'src/components/dar_analytics/useDarMetricsReport'
import { extractError } from 'src/utils/ErrorUtils'

interface AnalyticsSectionProps {
  title: string
  description?: React.ReactNode
  /** Shown beside the figures they qualify, whatever state the section is in. */
  caveats?: string[]
  /** Controls that change what the section reports, kept usable when it's empty or failed. */
  actions?: React.ReactNode
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
  title, description, caveats = [], actions, isLoading, isRefreshing = false, error, onRetry, isEmpty, emptyText, children,
}: AnalyticsSectionProps) => {
  const headingId = `${title.toLowerCase().replaceAll(/\W+/g, '-')}-heading`
  // On a study's or dataset's page the section sits under that page's own headings, the lowest of
  // which leaves no level beneath it, and an h2 there would turn every later section into its
  // child. The open tab names the report, so the title is plain text that still labels the section.
  const titleComponent = useDarMetricsTarget() ? 'div' : 'h2'

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
      <Typography component={titleComponent} id={headingId} sx={{ ...headingStyle, maxWidth: 'none', mt: '2rem' }}>{title}</Typography>
      {description && <Typography sx={{ ...descriptionStyle, mb: '1rem' }}>{description}</Typography>}
      {caveats.map(caveat => <Alert key={caveat} severity="info" sx={{ mb: '1rem' }}>{caveat}</Alert>)}
      {actions}
      {body()}
    </Box>
  )
}
