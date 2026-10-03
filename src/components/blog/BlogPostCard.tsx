import React from 'react'
import { Link } from 'react-router'
import { Box, Typography } from '@mui/material'
import { Theme } from 'src/libs/theme'
import { CategoryChip } from 'src/components/blog/BlogChips'
import { BlogImageResolver } from 'src/components/blog/useBlogImageResolver'
import { BlogPostSummary } from 'src/types/blog'
import { articlePath, formatBlogDate } from 'src/utils/BlogUtils'

interface BlogPostCardProps {
  readonly post: BlogPostSummary
  readonly resolveImage: BlogImageResolver
  readonly hero?: boolean
}

export const BlogPostCard = ({ post, resolveImage, hero = false }: BlogPostCardProps) => {
  const coverUrl = post.coverImageId ? resolveImage(post.coverImageId) : undefined
  return (
    <Box
      component="article"
      sx={{
        'display': 'grid',
        'gridTemplateColumns': { xs: '1fr', md: hero && coverUrl ? '3fr 2fr' : '1fr' },
        'border': '1px solid #e0e0e0',
        'borderRadius': '8px',
        'overflow': 'hidden',
        'backgroundColor': '#fff',
        'height': '100%',
        'transition': 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' },
        '&:focus-within': { boxShadow: `0 0 0 2px ${Theme.palette.link}` },
      }}
    >
      {coverUrl && (
        <Box sx={{ aspectRatio: '16 / 9', overflow: 'hidden', backgroundColor: '#f2f4f7' }}>
          <img src={coverUrl} alt={post.coverImageAlt ?? ''} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      )}
      <Box sx={{ padding: hero ? 3 : 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <CategoryChip category={post.category} />
          <Typography component="span" sx={{ fontSize: '1.3rem', color: '#666' }}>
            <time dateTime={post.publishDate ? new Date(post.publishDate).toISOString() : undefined}>{formatBlogDate(post.publishDate)}</time>
          </Typography>
        </Box>
        <Typography component={hero ? 'h2' : 'h3'} sx={{ fontSize: hero ? '2.6rem' : '1.9rem', fontWeight: 600, lineHeight: 1.3 }}>
          <Link to={articlePath(post.category, post.slug)} style={{ color: Theme.palette.primary, textDecoration: 'none' }}>
            {post.title}
          </Link>
        </Typography>
        {post.excerpt && <Typography sx={{ fontSize: hero ? '1.6rem' : '1.4rem', color: '#444' }}>{post.excerpt}</Typography>}
        {post.authorDisplayName && <Typography sx={{ fontSize: '1.3rem', color: '#666', marginTop: 'auto' }}>{`By ${post.authorDisplayName}`}</Typography>}
      </Box>
    </Box>
  )
}

export default BlogPostCard
