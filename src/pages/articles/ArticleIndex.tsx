import React, { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Alert, Box, Chip, LinearProgress, Pagination, Tab, Tabs, Typography } from '@mui/material'
import { Blog } from 'src/libs/ajax/Blog'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { BlogPostCard } from 'src/components/blog/BlogPostCard'
import { useBlogImageResolver } from 'src/components/blog/useBlogImageResolver'
import { BLOG_CATEGORIES, BLOG_CATEGORY_PLURAL_LABELS, BlogListPage } from 'src/types/blog'
import { articleCategoryPath, ARTICLES_PATH, categoryFromPath } from 'src/utils/BlogUtils'

export const ARTICLES_PAGE_SIZE = 12

const TABS_SX = { 'borderBottom': '1px solid #e0e0e0', 'marginBottom': 3, '& .MuiTab-root': { fontSize: '1.4rem', textTransform: 'none' } }

/**
 * Public article listing: /articles for everything, /articles/<category> for one category. The
 * tag filter and page number ride in the query string.
 */
export const ArticleIndex = () => {
  const { category: categorySegment } = useParams()
  const category = categoryFromPath(categorySegment)
  const unknownCategory = categorySegment !== undefined && category === undefined
  usePageTitle(category ? BLOG_CATEGORY_PLURAL_LABELS[category] : 'Articles')
  const [searchParams, setSearchParams] = useSearchParams()
  const tag = searchParams.get('tag') ?? undefined
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const resolveImage = useBlogImageResolver()
  // Keyed by the query that produced it, so changing tab or page shows loading, not stale articles.
  const queryKey = `${category ?? ''}|${tag ?? ''}|${page}`
  const [loaded, setLoaded] = useState<{ queryKey: string, result?: BlogListPage, failed: boolean }>()
  const current = loaded?.queryKey === queryKey ? loaded : undefined
  const result = current?.result
  const failed = current?.failed ?? false

  useEffect(() => {
    if (unknownCategory) {
      return
    }
    let active = true
    Blog.listPublished({ category, tag, page: page - 1, pageSize: ARTICLES_PAGE_SIZE })
      .then((list) => {
        if (active) {
          setLoaded({ queryKey, result: list, failed: false })
        }
      })
      .catch(() => {
        if (active) {
          setLoaded({ queryKey, failed: true })
        }
      })
    return () => {
      active = false
    }
  }, [unknownCategory, category, tag, page, queryKey])

  const updateParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setSearchParams(next)
  }

  if (unknownCategory) {
    return (
      <Box component="main" sx={{ maxWidth: 760, marginX: 'auto', paddingX: 3, paddingY: 6 }}>
        <Typography component="h1" sx={{ fontSize: '2.8rem', fontWeight: 600, marginBottom: 2 }}>Page not found</Typography>
        <Typography sx={{ fontSize: '1.6rem' }}>
          {'There is no such article category. '}
          <Link to={ARTICLES_PATH}>See all articles</Link>
        </Typography>
      </Box>
    )
  }

  const pageCount = result ? Math.ceil(result.total / ARTICLES_PAGE_SIZE) : 0
  const [hero, ...rest] = result?.items ?? []
  const showHero = page === 1 && hero?.featured === true
  const gridItems = showHero ? rest : result?.items ?? []

  return (
    <Box component="main" sx={{ maxWidth: 1200, marginX: 'auto', paddingX: 3, paddingY: 4 }}>
      <Typography component="h1" sx={{ fontSize: '3.6rem', fontWeight: 600, marginBottom: 1 }}>DUOS Articles</Typography>
      <Typography sx={{ fontSize: '1.6rem', color: '#555', marginBottom: 3 }}>
        News, user guides, feature announcements and policy updates from the DUOS team.
      </Typography>

      {/* Tabs are links, so each category has its own URL and the tag filter resets on switching. */}
      <Tabs value={category ?? 'ALL'} variant="scrollable" scrollButtons="auto" aria-label="Article categories" sx={TABS_SX}>
        <Tab value="ALL" label="All" component={Link} to={ARTICLES_PATH} />
        {BLOG_CATEGORIES.map(value => (
          <Tab key={value} value={value} label={BLOG_CATEGORY_PLURAL_LABELS[value]} component={Link} to={articleCategoryPath(value)} />
        ))}
      </Tabs>

      {tag && (
        <Box sx={{ marginBottom: 3 }}>
          <Chip label={`Tagged: ${tag}`} onDelete={() => updateParams({ tag: undefined, page: undefined })} sx={{ fontSize: '1.3rem' }} />
        </Box>
      )}

      {!result && !failed && <LinearProgress aria-label="Loading articles" />}
      {failed && <Alert severity="error" sx={{ fontSize: '1.4rem' }}>Articles could not be loaded. Please try again later.</Alert>}
      {result?.items.length === 0 && (
        <Typography sx={{ fontSize: '1.6rem', color: '#555' }}>
          {'No articles here yet. '}
          <Link to={ARTICLES_PATH}>See all articles</Link>
        </Typography>
      )}

      {showHero && hero && (
        <Box sx={{ marginBottom: 3 }}>
          <BlogPostCard post={hero} resolveImage={resolveImage} hero />
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {gridItems.map(post => <BlogPostCard key={post.blogPostId} post={post} resolveImage={resolveImage} />)}
      </Box>

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_event, value) => updateParams({ page: value === 1 ? undefined : String(value) })}
            sx={{ '& .MuiPaginationItem-root': { fontSize: '1.4rem' } }}
          />
        </Box>
      )}
    </Box>
  )
}

export default ArticleIndex
