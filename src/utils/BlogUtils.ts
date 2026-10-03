import { BLOG_CATEGORIES, BLOG_CATEGORY_PATHS, BlogCategory, BlogDisplayStatus, BlogPost, BlogPostRequest, BlogPostSummary } from 'src/types/blog'

/** Mirrors consent's slug rule: lowercase words joined by single hyphens. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

export const MAX_TITLE_LENGTH = 200
export const MAX_EXCERPT_LENGTH = 500

/**
 * Inline images are stored in Markdown as `duos-image:<uuid>` rather than a full URL, so the same
 * content renders against whichever consent environment serves it.
 */
export const DUOS_IMAGE_SCHEME = 'duos-image:'

export const toDuosImageUrl = (imageId: string): string => `${DUOS_IMAGE_SCHEME}${imageId}`

/** The image id a `duos-image:` URL points at, or undefined for any other URL. */
export const parseDuosImageId = (url: string): string | undefined =>
  url.startsWith(DUOS_IMAGE_SCHEME) ? url.slice(DUOS_IMAGE_SCHEME.length) || undefined : undefined

export const slugify = (title: string): string =>
  title
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
    .slice(0, 80)
    .replaceAll(/-+$/g, '')

export const ARTICLES_PATH = '/articles'

/** Public listing of one category, e.g. /articles/user-guides. */
export const articleCategoryPath = (category: BlogCategory): string => `${ARTICLES_PATH}/${BLOG_CATEGORY_PATHS[category]}`

/** Public URL of an article, e.g. /articles/user-guides/getting-started. */
export const articlePath = (category: BlogCategory, slug: string): string => `${articleCategoryPath(category)}/${slug}`

/** The category a URL segment names, or undefined for an unknown segment. */
export const categoryFromPath = (segment: string | undefined): BlogCategory | undefined =>
  BLOG_CATEGORIES.find(category => BLOG_CATEGORY_PATHS[category] === segment)

export const ADMIN_ARTICLES_PATH = '/admin_manage_articles'

export const adminArticleEditPath = (blogPostId: number): string => `${ADMIN_ARTICLES_PATH}/${blogPostId}`

export const displayStatus = (post: Pick<BlogPostSummary, 'status' | 'publishDate'>, now: number = Date.now()): BlogDisplayStatus =>
  post.status === 'PUBLISHED' && post.publishDate !== undefined && post.publishDate > now ? 'SCHEDULED' : post.status

/** Whether consent's public `/blog` endpoints would return this post — consent's visibility predicate. */
export const isPubliclyVisible = (post: Pick<BlogPostSummary, 'status' | 'publishDate'>, now: number = Date.now()): boolean =>
  post.status === 'PUBLISHED' && (post.publishDate === undefined || post.publishDate <= now)

const WORDS_PER_MINUTE = 200

export const readingTimeMinutes = (markdown: string): number => {
  const words = markdown.trim().split(/\s+/).filter(word => word.length > 0).length
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

export const formatBlogDate = (epochMillis: number | undefined): string =>
  epochMillis === undefined
    ? ''
    : new Date(epochMillis).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

/** The save request that reproduces a loaded post, carrying its `updateDate` for consent's stale-edit check. */
export const postToRequest = (post: BlogPost): BlogPostRequest => ({
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  contentMd: post.contentMd,
  category: post.category,
  tags: post.tags,
  status: post.status,
  publishDate: post.publishDate,
  featured: post.featured,
  authorDisplayName: post.authorDisplayName,
  coverImageId: post.coverImageId,
  coverImageAlt: post.coverImageAlt,
  parentSlug: post.parentSlug,
  updateDate: post.updateDate,
})

/** The HTTP status of a failed fetchAdapter request, if it got a response. */
export const errorStatus = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | undefined)?.response?.status
