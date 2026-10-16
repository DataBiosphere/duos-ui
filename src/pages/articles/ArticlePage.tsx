import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Box, Breadcrumbs, Chip, LinearProgress, Typography } from '@mui/material'
import { useArticleMeta } from 'src/hooks/useArticleMeta'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { ArticleMarkdown } from 'src/components/articles/ArticleMarkdown'
import { ArticleMessage } from 'src/components/articles/ArticleMessage'
import { ARTICLES } from 'src/content/articles/articles'
import { ARTICLE_CATEGORY_PLURAL_LABELS, Article } from 'src/types/article'
import {
  ARTICLES_PATH,
  articleCategoryPath,
  articlePath,
  categoryFromPath,
  fetchArticleBody,
  findArticle,
  formatArticleDate,
  readingTimeMinutes,
} from 'src/utils/ArticleUtils'

interface ArticleViewProps {
  readonly article: Article
  readonly parent?: Article
  readonly markdown: string
}

const ArticleView = ({ article, parent, markdown }: ArticleViewProps) => {
  const byline = [article.author && `By ${article.author}`, formatArticleDate(article.publishDate), `${readingTimeMinutes(markdown)} min read`]
  const tags = article.tags ?? []
  return (
    <Box component="main" sx={{ maxWidth: 760, marginX: 'auto', paddingX: 3, paddingY: 4 }}>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ fontSize: '1.4rem', marginBottom: 2 }}>
        <Link to={ARTICLES_PATH}>Articles</Link>
        <Link to={articleCategoryPath(article.category)}>{ARTICLE_CATEGORY_PLURAL_LABELS[article.category]}</Link>
        {parent && <Link to={articlePath(parent)}>{parent.title}</Link>}
        <Typography sx={{ fontSize: '1.4rem', color: '#555' }} aria-current="page">{article.title}</Typography>
      </Breadcrumbs>

      <Box component="article">
        <Box component="header" sx={{ marginBottom: 3 }}>
          <Typography component="h1" sx={{ fontSize: '3.4rem', fontWeight: 600, lineHeight: 1.25, marginBottom: 1.5 }}>{article.title}</Typography>
          <Typography sx={{ fontSize: '1.4rem', color: '#555' }}>{byline.filter(Boolean).join(' · ')}</Typography>
        </Box>

        <ArticleMarkdown markdown={markdown} />

        {tags.length > 0 && (
          <Box component="footer" sx={{ marginTop: 4, paddingTop: 2, borderTop: '1px solid #e0e0e0', display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {tags.map(tag => (
              <Chip key={tag} label={tag} component={Link} to={`${ARTICLES_PATH}?tag=${encodeURIComponent(tag)}`} clickable size="small" sx={{ fontSize: '1.2rem' }} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

/** /articles/<category>/<slug>. Drafts and future-dated articles show as not found. */
export const ArticlePage = () => {
  const { category: categorySegment, slug } = useParams()
  const { article, parent } = findArticle(ARTICLES, categoryFromPath(categorySegment), slug)
  useArticleMeta(article)
  usePageTitle(article?.title ?? 'Articles')
  // Keyed by path, so following a link to another article shows loading rather than the old body.
  const path = article ? articlePath(article) : undefined
  const [body, setBody] = useState<{ path: string, markdown?: string, failed: boolean }>()
  const current = body?.path === path ? body : undefined

  useEffect(() => {
    if (article === undefined) {
      return
    }
    let active = true
    const settle = (result: { markdown?: string, failed: boolean }) => {
      if (active) {
        setBody({ path: articlePath(article), ...result })
      }
    }
    fetchArticleBody(article)
      .then(markdown => settle({ markdown, failed: false }))
      .catch(() => settle({ failed: true }))
    return () => {
      active = false
    }
  }, [article])

  if (article === undefined) {
    return <ArticleMessage title="Article not found" message="This article may have moved or been removed." />
  }
  if (current?.failed) {
    return <ArticleMessage title="Something went wrong" message="The article could not be loaded. Please try again later." />
  }
  if (current?.markdown === undefined) {
    return <LinearProgress aria-label="Loading article" />
  }
  return <ArticleView article={article} parent={parent} markdown={current.markdown} />
}

export default ArticlePage
