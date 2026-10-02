import React from 'react'
import { Alert, Box, CircularProgress, Typography } from '@mui/material'
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
  isEmpty: boolean
  emptyText: string
  children: React.ReactNode
}

export const AnalyticsSection = ({
  title, description, caveats = [], isLoading, isRefreshing = false, error, isEmpty, emptyText, children,
}: AnalyticsSectionProps) => {
  const headingId = `${title.toLowerCase().replaceAll(/\W+/g, '-')}-heading`

  const content = () => {
    if (error) {
      return <Alert severity="error">Unable to load {title}: {extractError(error)}</Alert>
    }
    if (isEmpty) {
      return <Typography sx={descriptionStyle}>{emptyText}</Typography>
    }
    return children
  }
  const body = () => (isLoading
    ? <CircularProgress aria-label={`Loading ${title}`} />
    : <Box aria-busy={isRefreshing} sx={{ opacity: isRefreshing ? 0.5 : 1 }}>{content()}</Box>)

  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography component="h2" id={headingId} sx={{ ...headingStyle, maxWidth: 'none', mt: '2rem' }}>{title}</Typography>
      {description && <Typography sx={{ ...descriptionStyle, mb: '1rem' }}>{description}</Typography>}
      {caveats.map(caveat => <Alert key={caveat} severity="info" sx={{ mb: '1rem' }}>{caveat}</Alert>)}
      {body()}
    </Box>
  )
}
