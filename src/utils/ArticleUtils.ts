import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_PATHS, Article, ArticleCategory } from 'src/types/article'

export const ARTICLES_PATH = '/articles'

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Date.parse rolls an impossible date such as 2025-02-29 over into the next month.
const isCalendarDate = (date: string): boolean =>
  DATE_PATTERN.test(date) && !Number.isNaN(Date.parse(date)) && new Date(date).toISOString().startsWith(date)

/** Article bodies by file path, e.g. /src/content/articles/user-guides/dacguide.md, as asset URLs. */
export const ARTICLE_BODY_URLS: Record<string, string> = import.meta.glob(
  '/src/content/articles/*/*.md',
  { query: '?url', import: 'default', eager: true },
)

export const articleCategoryPath = (category: ArticleCategory): string =>
  `${ARTICLES_PATH}/${ARTICLE_CATEGORY_PATHS[category]}`

export const articlePath = (article: Pick<Article, 'category' | 'slug'>): string =>
  `${articleCategoryPath(article.category)}/${article.slug}`

/** The category a URL segment names, or undefined for an unknown segment. */
export const categoryFromPath = (segment: string | undefined): ArticleCategory | undefined =>
  ARTICLE_CATEGORIES.find(category => ARTICLE_CATEGORY_PATHS[category] === segment)

export const articleBodyFile = (article: Pick<Article, 'category' | 'slug'>): string =>
  `/src/content/articles/${ARTICLE_CATEGORY_PATHS[article.category]}/${article.slug}.md`

/** Drafts and articles dated in the future are hidden. */
export const isArticleVisible = (article: Pick<Article, 'draft' | 'publishDate'>, now: number = Date.now()): boolean =>
  !article.draft && Date.parse(article.publishDate) <= now

/** Visible articles, featured first, then newest first. */
export const visibleArticles = (articles: readonly Article[], now: number = Date.now()): Article[] =>
  articles
    .filter(article => isArticleVisible(article, now))
    .sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || b.publishDate.localeCompare(a.publishDate))

/** Visible articles in one category (or all) carrying a tag (or any). */
export const listArticles = (
  articles: readonly Article[],
  category: ArticleCategory | undefined,
  tag: string | undefined,
  now: number = Date.now(),
): Article[] => {
  const inCategory = (article: Article) => category === undefined || article.category === category
  const tagged = (article: Article) => tag === undefined || (article.tags ?? []).includes(tag)
  return visibleArticles(articles, now).filter(article => inCategory(article) && tagged(article))
}

/** The page a ?page= value names, kept within 1..pageCount. */
export const pageNumber = (param: string | null, pageCount: number): number =>
  Math.min(Math.max(1, pageCount), Math.max(1, Math.trunc(Number(param)) || 1))

/** A visible article and the visible page it sits under, if any. */
export const findArticle = (
  articles: readonly Article[],
  category: ArticleCategory | undefined,
  slug: string | undefined,
): { article?: Article, parent?: Article } => {
  const visible = articles.filter(entry => isArticleVisible(entry))
  const article = visible.find(entry => entry.category === category && entry.slug === slug)
  const parent = visible.find(entry => entry.category === 'PAGE' && entry.slug === article?.parent)
  return { article, parent }
}

export const formatArticleDate = (publishDate: string): string =>
  new Date(publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

export const readingTimeMinutes = (markdown: string): number =>
  Math.max(1, Math.round(markdown.split(/\s+/).filter(word => word !== '').length / 200))

export const fetchArticleBody = async (
  article: Pick<Article, 'category' | 'slug'>,
  bodyUrls: Record<string, string> = ARTICLE_BODY_URLS,
): Promise<string> => {
  const url = bodyUrls[articleBodyFile(article)]
  if (url === undefined) {
    throw new Error(`No body for ${articlePath(article)}`)
  }
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to load ${articlePath(article)}: ${res.status}`)
  }
  return res.text()
}

const articleErrors = (article: Article): string[] => {
  const errors: string[] = []
  if (!SLUG_PATTERN.test(article.slug)) {
    errors.push('slug must be lowercase words joined by hyphens')
  }
  if (article.title.trim() === '') {
    errors.push('title is empty')
  }
  if (article.excerpt.trim() === '') {
    errors.push('excerpt is empty')
  }
  if (!isCalendarDate(article.publishDate)) {
    errors.push('publishDate must be a YYYY-MM-DD date')
  }
  if (article.legacyUrl !== undefined && !article.legacyUrl.startsWith('https://')) {
    errors.push('legacyUrl must be an https URL')
  }
  return errors
}

/** Errors that depend on the other articles in the list. */
const listErrors = (article: Article, index: number, articles: readonly Article[], pageSlugs: Set<string>): string[] => {
  const earlier = articles.slice(0, index)
  const errors: string[] = []
  if (earlier.some(other => articlePath(other) === articlePath(article))) {
    errors.push('listed more than once')
  }
  if (article.parent !== undefined && !pageSlugs.has(article.parent)) {
    errors.push(`parent ${article.parent} is not a page`)
  }
  if (article.legacyUrl !== undefined && earlier.some(other => other.legacyUrl === article.legacyUrl)) {
    errors.push(`legacyUrl ${article.legacyUrl} is used by another article`)
  }
  return errors
}

/** Problems with the article index and its body files; empty when they agree and every entry is valid. */
export const validateArticles = (articles: readonly Article[], bodyFiles: readonly string[]): string[] => {
  const pageSlugs = new Set(articles.filter(article => article.category === 'PAGE').map(article => article.slug))
  const entryErrors = articles.flatMap((article, index) => {
    const missingBody = bodyFiles.includes(articleBodyFile(article)) ? [] : [`missing ${articleBodyFile(article)}`]
    return [...articleErrors(article), ...listErrors(article, index, articles, pageSlugs), ...missingBody]
      .map(error => `${articlePath(article)}: ${error}`)
  })
  const expectedFiles = new Set(articles.map(articleBodyFile))
  const unlistedFiles = bodyFiles.filter(file => !expectedFiles.has(file)).map(file => `${file}: not listed in articles.ts`)
  return [...entryErrors, ...unlistedFiles]
}
