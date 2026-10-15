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

/** Problems with the article index and its body files; empty when they agree and every entry is valid. */
export const validateArticles = (articles: readonly Article[], bodyFiles: readonly string[]): string[] => {
  const errors: string[] = []
  const seen = new Set<string>()
  const legacyUrls = new Set<string>()
  const pageSlugs = new Set(articles.filter(article => article.category === 'PAGE').map(article => article.slug))
  for (const article of articles) {
    const path = articlePath(article)
    errors.push(...articleErrors(article).map(error => `${path}: ${error}`))
    if (seen.has(path)) {
      errors.push(`${path}: listed more than once`)
    }
    seen.add(path)
    if (article.parent !== undefined && !pageSlugs.has(article.parent)) {
      errors.push(`${path}: parent ${article.parent} is not a page`)
    }
    if (article.legacyUrl !== undefined) {
      if (legacyUrls.has(article.legacyUrl)) {
        errors.push(`${path}: legacyUrl ${article.legacyUrl} is used by another article`)
      }
      legacyUrls.add(article.legacyUrl)
    }
    if (!bodyFiles.includes(articleBodyFile(article))) {
      errors.push(`${path}: missing ${articleBodyFile(article)}`)
    }
  }
  const expectedFiles = new Set(articles.map(articleBodyFile))
  for (const file of bodyFiles) {
    if (!expectedFiles.has(file)) {
      errors.push(`${file}: not listed in articles.ts`)
    }
  }
  return errors
}
