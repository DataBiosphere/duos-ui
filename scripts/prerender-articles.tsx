// Writes a static page per visible article into build/articles/<category path>/<slug>.html, and
// build/sitemap.xml, so search engines and link previews get each article's content without
// running the app. server/src/pages/articlePages.ts serves the pages. Run after `vite build`:
// tsx scripts/prerender-articles.tsx
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ARTICLES } from 'src/content/articles/articles'
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_PATHS, Article } from 'src/types/article'
import { ARTICLE_META_ATTRIBUTE, SITE_ORIGIN, articleHeadTags } from 'src/utils/articleMeta'

// ArticleUtils can't be imported here: it uses import.meta.glob, which only Vite provides.
const pathOf = (article: Pick<Article, 'category' | 'slug'>) => `/articles/${ARTICLE_CATEGORY_PATHS[article.category]}/${article.slug}`

const isVisible = (article: Article, now: number) => !article.draft && Date.parse(article.publishDate) <= now

const escapeHtml = (text: string) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

/** The article body as plain HTML; like the app's renderer, it never passes raw HTML through. */
export const renderMarkdown = (markdown: string): string =>
  renderToStaticMarkup(<ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>)

const headTagHtml = ({ tag, attributes }: { tag: string, attributes: Readonly<Record<string, string>> }) =>
  `<${tag} ${Object.entries(attributes).map(([name, value]) => `${name}="${escapeHtml(value)}"`).join(' ')} ${ARTICLE_META_ATTRIBUTE}>`

/**
 * The app's index.html with the article's title and head tags (src/utils/articleMeta.ts), and its
 * content in #root. The app replaces #root when it starts, so readers still get the app.
 */
export const articlePageHtml = (indexHtml: string, article: Article, bodyHtml: string): string => {
  const title = escapeHtml(article.title)
  const head = [`<title>${title} | DUOS</title>`, ...articleHeadTags(article).map(headTagHtml)].join('\n  ')
  const content = `<main><article><h1>${title}</h1>${bodyHtml}</article></main>`
  // Replacer functions, so a $ in the content is never read as a replacement pattern.
  return indexHtml.replace(/<title>[^<]*<\/title>/, () => head).replace('<div id="root"></div>', () => `<div id="root">${content}</div>`)
}

export const sitemapXml = (articles: readonly Article[]): string => {
  const pages: { path: string, lastmod?: string }[] = [
    { path: '/articles' },
    ...ARTICLE_CATEGORIES.map(category => ({ path: `/articles/${ARTICLE_CATEGORY_PATHS[category]}` })),
    ...articles.map(article => ({ path: pathOf(article), lastmod: article.publishDate })),
  ]
  const urls = pages.map(({ path, lastmod }) =>
    `  <url><loc>${SITE_ORIGIN}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}

interface PrerenderOptions {
  readonly buildDir: string
  /** Holds articles/<category path>/<slug>.md. */
  readonly contentDir: string
  readonly articles: readonly Article[]
  readonly now: number
}

/** Pages for articles dated in the future appear at the first build on or after their date. */
export const prerenderArticles = async ({ buildDir, contentDir, articles, now }: PrerenderOptions): Promise<number> => {
  const indexHtml = await readFile(`${buildDir}/index.html`, 'utf8')
  const visible = articles.filter(article => isVisible(article, now))
  await Promise.all(ARTICLE_CATEGORIES.map(category =>
    mkdir(`${buildDir}/articles/${ARTICLE_CATEGORY_PATHS[category]}`, { recursive: true })))
  await Promise.all(visible.map(async (article) => {
    const markdown = await readFile(`${contentDir}${pathOf(article)}.md`, 'utf8')
    await writeFile(`${buildDir}${pathOf(article)}.html`, articlePageHtml(indexHtml, article, renderMarkdown(markdown)))
  }))
  await writeFile(`${buildDir}/sitemap.xml`, sitemapXml(visible))
  return visible.length
}

/* v8 ignore start -- the command-line entry point */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = await prerenderArticles({ buildDir: 'build', contentDir: 'src/content', articles: ARTICLES, now: Date.now() })
  console.log(`Prerendered ${count} articles`)
}
/* v8 ignore stop */
