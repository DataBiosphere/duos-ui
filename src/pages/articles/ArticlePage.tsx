import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Box, Breadcrumbs, Chip, LinearProgress, Typography } from '@mui/material'
import { Blog } from 'src/libs/ajax/Blog'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { BlogMarkdown } from 'src/components/blog/BlogMarkdown'
import { CategoryChip } from 'src/components/blog/BlogChips'
import { useBlogImageResolver } from 'src/components/blog/useBlogImageResolver'
import { BLOG_CATEGORY_PLURAL_LABELS, BlogPost } from 'src/types/blog'
import { articleCategoryPath, ARTICLES_PATH, categoryFromPath, errorStatus, formatBlogDate, readingTimeMinutes } from 'src/utils/BlogUtils'

type LoadState = { kind: 'loading' } | { kind: 'loaded', post: BlogPost } | { kind: 'notFound' } | { kind: 'error' }

const LOADING: LoadState = { kind: 'loading' }

const NOT_FOUND: LoadState = { kind: 'notFound' }

const titleCase = (slug: string): string => slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')

/** Public article at /articles/<category>/<slug>. */
export const ArticlePage = () => {
  const { category: categorySegment, slug = '' } = useParams()
  const category = categoryFromPath(categorySegment)
  const resolveImage = useBlogImageResolver()
  // Keyed by URL, so following a link to another article shows loading rather than the old one.
  const articleKey = `${categorySegment}/${slug}`
  const [result, setResult] = useState<{ articleKey: string, state: LoadState }>()
  let state = result?.articleKey === articleKey ? result.state : LOADING
  if (category === undefined) {
    state = NOT_FOUND
  }
  usePageTitle(state.kind === 'loaded' ? state.post.title : 'Articles')

  useEffect(() => {
    if (category === undefined) {
      return
    }
    let active = true
    Blog.getPublished(category, slug)
      .then((post) => {
        if (active) {
          setResult({ articleKey, state: { kind: 'loaded', post } })
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setResult({ articleKey, state: { kind: errorStatus(error) === 404 ? 'notFound' : 'error' } })
        }
      })
    return () => {
      active = false
    }
  }, [category, slug, articleKey])

  if (state.kind === 'loading') {
    return <LinearProgress aria-label="Loading article" />
  }

  if (state.kind !== 'loaded') {
    return (
      <Box component="main" sx={{ maxWidth: 760, marginX: 'auto', paddingX: 3, paddingY: 6 }}>
        <Typography component="h1" sx={{ fontSize: '2.8rem', fontWeight: 600, marginBottom: 2 }}>
          {state.kind === 'notFound' ? 'Article not found' : 'Something went wrong'}
        </Typography>
        <Typography sx={{ fontSize: '1.6rem' }}>
          {state.kind === 'notFound' ? 'This article may have moved or been removed. ' : 'The article could not be loaded. Please try again later. '}
          <Link to={ARTICLES_PATH}>Back to articles</Link>
        </Typography>
      </Box>
    )
  }

  const { post } = state
  const coverUrl = post.coverImageId ? resolveImage(post.coverImageId) : undefined
  const updatedAfterPublish = post.updateDate !== undefined && post.publishDate !== undefined && post.updateDate > post.publishDate

  return (
    <Box component="main" sx={{ maxWidth: 760, marginX: 'auto', paddingX: 3, paddingY: 4 }}>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: '1.4rem', marginBottom: 2 }}>
        <Link to={ARTICLES_PATH}>Articles</Link>
        <Link to={articleCategoryPath(post.category)}>{BLOG_CATEGORY_PLURAL_LABELS[post.category]}</Link>
        {post.parentSlug && <Typography sx={{ fontSize: '1.4rem', color: '#555' }}>{titleCase(post.parentSlug)}</Typography>}
        <Typography sx={{ fontSize: '1.4rem', color: '#555' }}>{post.title}</Typography>
      </Breadcrumbs>

      <Box component="article">
        <Box component="header" sx={{ marginBottom: 3 }}>
          <Box sx={{ marginBottom: 1.5 }}><CategoryChip category={post.category} /></Box>
          <Typography component="h1" sx={{ fontSize: '3.4rem', fontWeight: 600, lineHeight: 1.25, marginBottom: 1.5 }}>{post.title}</Typography>
          <Typography sx={{ fontSize: '1.4rem', color: '#555' }}>
            {[
              post.authorDisplayName && `By ${post.authorDisplayName}`,
              formatBlogDate(post.publishDate),
              `${readingTimeMinutes(post.contentMd)} min read`,
            ].filter(Boolean).join(' · ')}
          </Typography>
        </Box>

        {coverUrl && (
          <Box sx={{ marginBottom: 3, borderRadius: '8px', overflow: 'hidden' }}>
            <img src={coverUrl} alt={post.coverImageAlt ?? ''} style={{ width: '100%', display: 'block' }} />
          </Box>
        )}

        <BlogMarkdown markdown={post.contentMd} />

        <Box component="footer" sx={{ marginTop: 4, paddingTop: 2, borderTop: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {post.tags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {post.tags.map(tag => (
                <Chip key={tag} label={tag} component={Link} to={`${ARTICLES_PATH}?tag=${encodeURIComponent(tag)}`} clickable size="small" sx={{ fontSize: '1.2rem' }} />
              ))}
            </Box>
          )}
          {updatedAfterPublish && (
            <Typography sx={{ fontSize: '1.3rem', color: '#666' }}>{`Last updated ${formatBlogDate(post.updateDate)}`}</Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ArticlePage
