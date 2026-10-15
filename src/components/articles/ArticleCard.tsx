import React from 'react'
import { Link } from 'react-router'
import { Box, Chip, Typography } from '@mui/material'
import { Theme } from 'src/libs/theme'
import { ARTICLE_CATEGORY_LABELS, Article } from 'src/types/article'
import { articlePath, formatArticleDate } from 'src/utils/ArticleUtils'

export const ArticleCard = ({ article }: { readonly article: Article }) => (
  <Box
    component="article"
    sx={{
      'border': '1px solid #e0e0e0',
      'borderRadius': '8px',
      'backgroundColor': '#fff',
      'height': '100%',
      'padding': 2,
      'display': 'flex',
      'flexDirection': 'column',
      'gap': 1,
      '&:hover': { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' },
      '&:focus-within': { boxShadow: `0 0 0 2px ${Theme.palette.link}` },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <Chip label={ARTICLE_CATEGORY_LABELS[article.category]} size="small" variant="outlined" sx={{ fontSize: '1.2rem', fontWeight: 600 }} />
      <Typography component="time" dateTime={article.publishDate} sx={{ fontSize: '1.3rem', color: '#666' }}>
        {formatArticleDate(article.publishDate)}
      </Typography>
    </Box>
    <Typography component="h2" sx={{ fontSize: '1.9rem', fontWeight: 600, lineHeight: 1.3 }}>
      <Link to={articlePath(article)} style={{ color: Theme.palette.primary, textDecoration: 'none' }}>{article.title}</Link>
    </Typography>
    <Typography sx={{ fontSize: '1.4rem', color: '#444' }}>{article.excerpt}</Typography>
    {article.author && <Typography sx={{ fontSize: '1.3rem', color: '#666', marginTop: 'auto' }}>{`By ${article.author}`}</Typography>}
  </Box>
)
