import React, { useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { useTableOfContents } from './TableOfContentsContext'

interface Props extends React.PropsWithChildren {
  id: string
  heading: string
  style?: React.CSSProperties
}

const StudyPageSection = ({ id, heading, style, children }: Props) => {
  const { register } = useTableOfContents()
  useEffect(() => register({ id, heading }), [id, heading, register])
  return (
    <Box
      component="section"
      id={id}
      sx={{ pt: 4, pr: { xs: 0, lg: 4 }, scrollMarginTop: 20 }}
      style={style}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{heading}</Typography>
      {children}
    </Box>
  )
}

export default StudyPageSection
