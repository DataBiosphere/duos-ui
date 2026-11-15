import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useTableOfContents } from './TableOfContentsContext'

interface Props extends React.PropsWithChildren {
  id: string
  heading: string
  /** Shown in parentheses after the heading on the page; the table of contents lists the heading alone. */
  count?: number
  style?: React.CSSProperties
}

const StudyPageSection = ({ id, heading, count, style, children }: Props) => {
  const { register } = useTableOfContents()
  useEffect(() => register({ id, heading }), [id, heading, register])
  return (
    <Box
      component="section"
      id={id}
      sx={{ pt: 4, pr: { xs: 0, lg: 4 }, scrollMarginTop: 20 }}
      style={style}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        {count === undefined ? heading : `${heading} (${count})`}
      </Typography>
      {children}
    </Box>
  )
}

export default StudyPageSection
