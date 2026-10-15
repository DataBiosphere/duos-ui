import React, { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Box, Chip, Pagination, Tab, Tabs, Typography } from '@mui/material'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { ArticleCard } from 'src/components/articles/ArticleCard'
import { ArticleMessage } from 'src/components/articles/ArticleMessage'
import { ARTICLES } from 'src/content/articles/articles'
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_PLURAL_LABELS, ArticleCategory } from 'src/types/article'
import { ARTICLES_PATH, articleCategoryPath, categoryFromPath, listArticles, pageNumber } from 'src/utils/ArticleUtils'

export const ARTICLES_PAGE_SIZE = 12

const TABS_SX = { 'borderBottom': '1px solid #e0e0e0', 'marginBottom': 3, '& .MuiTab-root': { fontSize: '1.4rem', textTransform: 'none' } }

const CATEGORY_TABS: { value: ArticleCategory | 'ALL', label: string, to: string }[] = [
  { value: 'ALL', label: 'All', to: ARTICLES_PATH },
  ...ARTICLE_CATEGORIES.map(value => ({ value, label: ARTICLE_CATEGORY_PLURAL_LABELS[value], to: articleCategoryPath(value) })),
]

/** Category links styled as tabs, per MUI's nav tabs pattern; each category has its own URL. */
const CategoryTabs = ({ category }: { readonly category?: ArticleCategory }) => {
  const selected = category ?? 'ALL'
  return (
    <Tabs value={selected} variant="scrollable" scrollButtons="auto" role="navigation" aria-label="Article categories" sx={TABS_SX}>
      {CATEGORY_TABS.map(({ value, label, to }) => (
        <Tab key={value} value={value} label={label} component={Link} to={to} aria-current={value === selected ? 'page' : undefined} />
      ))}
    </Tabs>
  )
}

/** /articles lists every article and /articles/<category> one category; the tag and page ride in the query string. */
export const ArticleIndex = () => {
  const { category: categorySegment } = useParams()
  const category = categoryFromPath(categorySegment)
  usePageTitle(category ? ARTICLE_CATEGORY_PLURAL_LABELS[category] : 'Articles')
  const [searchParams, setSearchParams] = useSearchParams()
  const tag = searchParams.get('tag') ?? undefined
  const articles = useMemo(() => listArticles(ARTICLES, category, tag), [category, tag])
  const pageCount = Math.ceil(articles.length / ARTICLES_PAGE_SIZE)
  const page = pageNumber(searchParams.get('page'), pageCount)

  if (categorySegment !== undefined && category === undefined) {
    return <ArticleMessage title="Page not found" message="There is no such article category." />
  }

  const pageArticles = articles.slice((page - 1) * ARTICLES_PAGE_SIZE, page * ARTICLES_PAGE_SIZE)

  return (
    <Box component="main" sx={{ maxWidth: 1200, marginX: 'auto', paddingX: 3, paddingY: 4 }}>
      <Typography component="h1" sx={{ fontSize: '3.6rem', fontWeight: 600, marginBottom: 1 }}>DUOS Articles</Typography>
      <Typography sx={{ fontSize: '1.6rem', color: '#555', marginBottom: 3 }}>
        News, user guides, feature announcements and policy updates from the DUOS team.
      </Typography>

      <CategoryTabs category={category} />

      {tag && (
        <Box sx={{ marginBottom: 3 }}>
          <Chip label={`Tagged: ${tag}`} onDelete={() => setSearchParams({})} sx={{ fontSize: '1.3rem' }} />
        </Box>
      )}

      {articles.length === 0 && (
        <Typography sx={{ fontSize: '1.6rem', color: '#555' }}>
          {'No articles here yet. '}
          <Link to={ARTICLES_PATH}>See all articles</Link>
        </Typography>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
        {pageArticles.map(article => <ArticleCard key={`${article.category}/${article.slug}`} article={article} />)}
      </Box>

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_event, value) => setSearchParams({ ...(tag && { tag }), ...(value > 1 && { page: String(value) }) })}
            sx={{ '& .MuiPaginationItem-root': { fontSize: '1.4rem' } }}
          />
        </Box>
      )}
    </Box>
  )
}

export default ArticleIndex
