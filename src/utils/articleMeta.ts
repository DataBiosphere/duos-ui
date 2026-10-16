import { ARTICLE_CATEGORY_PATHS, Article } from 'src/types/article'

export const SITE_ORIGIN = 'https://duos.org'

/** Marks the head tags an article page adds, whether prebuilt or set by the app. */
export const ARTICLE_META_ATTRIBUTE = 'data-article-meta'

export interface HeadTag {
  readonly tag: 'meta' | 'link'
  readonly attributes: Readonly<Record<string, string>>
}

/** Description, canonical URL and link-preview tags; canonical URLs are on duos.org in every environment. */
export const articleHeadTags = (article: Article): HeadTag[] => {
  const url = `${SITE_ORIGIN}/articles/${ARTICLE_CATEGORY_PATHS[article.category]}/${article.slug}`
  return [
    { tag: 'meta', attributes: { name: 'description', content: article.excerpt } },
    { tag: 'link', attributes: { rel: 'canonical', href: url } },
    { tag: 'meta', attributes: { property: 'og:type', content: 'article' } },
    { tag: 'meta', attributes: { property: 'og:title', content: article.title } },
    { tag: 'meta', attributes: { property: 'og:description', content: article.excerpt } },
    { tag: 'meta', attributes: { property: 'og:url', content: url } },
    { tag: 'meta', attributes: { name: 'twitter:card', content: 'summary' } },
  ]
}
