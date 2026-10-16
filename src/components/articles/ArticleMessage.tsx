import React from 'react'
import { Link } from 'react-router'
import { Box, Typography } from '@mui/material'
import { ARTICLES_PATH } from 'src/utils/ArticleUtils'

interface ArticleMessageProps {
  readonly title: string
  readonly message: string
}

/** A not-found or error page with a way back to the article list. */
export const ArticleMessage = ({ title, message }: ArticleMessageProps) => (
  <Box component="main" sx={{ maxWidth: 760, marginX: 'auto', paddingX: 3, paddingY: 6 }}>
    <Typography component="h1" sx={{ fontSize: '2.8rem', fontWeight: 600, marginBottom: 2 }}>{title}</Typography>
    <Typography sx={{ fontSize: '1.6rem' }}>
      {`${message} `}
      <Link to={ARTICLES_PATH}>See all articles</Link>
    </Typography>
  </Box>
)
