import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useTableOfContents } from './TableOfContentsContext'

interface Props extends React.PropsWithChildren {
  id: string
  heading: string
  /** Shown after the heading, such as a count, but left out of the table of contents so the entry doesn't change as it loads. */
  headingDetail?: string
  style?: React.CSSProperties
}

const StudyPageSection = ({ id, heading, headingDetail, style, children }: Props) => {
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
        {headingDetail ? `${heading} ${headingDetail}` : heading}
      </Typography>
      {children}
    </Box>
  )
}

export default StudyPageSection
