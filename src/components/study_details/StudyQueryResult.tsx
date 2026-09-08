import React from 'react'
import { CircularProgress, Typography } from '@mui/material'

interface Props extends React.PropsWithChildren {
  isPending: boolean
  error?: unknown
  isEmpty?: boolean
  emptyMessage?: string
  errorMessage: string
}

/** Keeps loading, error, and empty states consistent across study-page sections. */
const StudyQueryResult = ({
  isPending,
  error,
  isEmpty = false,
  emptyMessage,
  errorMessage,
  children,
}: Props) => {
  if (isPending) return <CircularProgress size={24} />
  if (error) return <Typography role="alert">{errorMessage}</Typography>
  if (isEmpty) return <Typography color="text.secondary">{emptyMessage}</Typography>
  return children
}

export default StudyQueryResult
