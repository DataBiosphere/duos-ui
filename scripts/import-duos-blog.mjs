// Imports the duos.blog WordPress.com site into src/content/articles and public/article-images.
// Run from the repo root: node scripts/import-duos-blog.mjs
// The output is committed and reviewed as a normal diff; rerunning overwrites it.
import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import TurndownService from 'turndown'
import { gfm } from '@joplin/turndown-plugin-gfm'

const API = 'https://public-api.wordpress.com/rest/v1.1/sites/duos.blog/posts/'
const FIELDS = 'ID,URL,slug,title,date,excerpt,content,tags,type'
const CONTENT_DIR = 'src/content/articles'
const IMAGE_DIR = 'public/article-images'

export const CATEGORY_PATHS = {
  BLOG_POST: 'blog-posts',
  USER_GUIDE: 'user-guides',
  FEATURE_ANNOUNCEMENT: 'feature-announcements',
  IN_THE_NEWS: 'in-the-news',
  POLICY_BRIEF: 'policy-briefs',
  PAGE: 'pages',
}

// WordPress's listing pages; the /articles index replaces them.
export const LISTING_REDIRECTS = {
  '/': '/articles',
  '/feature-announcements/': '/articles/feature-announcements',
}

// WordPress kept its default slug for this post.
const SLUG_OVERRIDES = { 'hello-world': 'nih-genomic-data-sharing-policy-update' }

const POST_TAG_CATEGORIES = {
  'User Guides': 'USER_GUIDE',
  'Feature': 'FEATURE_ANNOUNCEMENT',
  'Policy': 'POLICY_BRIEF',
  'Article': 'IN_THE_NEWS',
}

export const legacyPath = url => new URL(url).pathname

export const categoryFor = (item) => {
  const path = legacyPath(item.URL)
  if (item.type === 'page') {
    if (path.startsWith('/help/') && path !== '/help/') {
      return 'USER_GUIDE'
    }
    return path.startsWith('/feature-announcements/') ? 'FEATURE_ANNOUNCEMENT' : 'PAGE'
  }
  const tag = Object.keys(item.tags ?? {}).find(name => POST_TAG_CATEGORIES[name])
  return tag ? POST_TAG_CATEGORIES[tag] : 'BLOG_POST'
}

/** The page's last path segment, in the lowercase-hyphen form article slugs use. */
export const slugFor = item => SLUG_OVERRIDES[item.slug] ?? item.slug.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '')

/** The help pages sit under the Help page; everything else is top level. */
export const parentFor = item => (item.type === 'page' && /^\/help\/.+/.test(legacyPath(item.URL)) ? 'help' : undefined)

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', hellip: '…' }

export const decodeEntities = text => text
  .replaceAll(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
  .replaceAll(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
  .replaceAll(/&([a-z]+);/g, (match, name) => ENTITIES[name] ?? match)

// Block boundaries become spaces; inline tags vanish so no space lands before punctuation.
export const plainText = html => decodeEntities(html.replaceAll(/<br ?\/?>|<\/(?:p|h\d|li|div|td)>/g, ' ').replaceAll(/<[^>]+>/g, ''))
  .replaceAll('\u200B', '')
  .replaceAll(/\s+/g, ' ')
  .trim()

/** The first real paragraph as plain text, cut at a word boundary; headings and captions are skipped. */
export const excerptFrom = (html, maxLength = 200) => {
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(match => plainText(match[1]))
  const text = paragraphs.find(paragraph => paragraph.length >= 60) ?? plainText(html)
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, text.lastIndexOf(' ', maxLength))}…`
}

export const createConverter = () => {
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
  turndown.use(gfm)
  // Raw HTML is never rendered, so an embedded video becomes a link to it.
  turndown.addRule('youtube', {
    filter: node => node.nodeName === 'IFRAME' && /youtube\.com\/embed\//.test(node.getAttribute('src') ?? ''),
    replacement: (_content, node) => {
      const id = node.getAttribute('src').match(/embed\/([\w-]+)/)[1]
      return `\n\n[Watch the video on YouTube](https://www.youtube.com/watch?v=${id})\n\n`
    },
  })
  turndown.remove(['script', 'style', 'iframe'])
  return html => turndown.turndown(html)
}

/** Points duos.blog links at the migrated articles, by path or by WordPress's ?p=<id> form. */
export const rewriteLinks = (markdown, targetsByPath, targetsById) =>
  markdown.replaceAll(/https?:\/\/(?:www\.)?duos\.blog(\/[^\s)"]*)?/g, (match, rest = '/') => {
    const id = /[?&](?:amp;|#038;)?p=(\d+)/.exec(rest)?.[1]
    const path = rest.split(/[?#]/)[0]
    const fragment = /#[\w-]+$/.exec(rest)?.[0] ?? ''
    const target = id ? targetsById.get(Number(id)) : targetsByPath.get(path.endsWith('/') ? path : `${path}/`)
    return target ? target + fragment : match
  })

const IMAGE_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' }

const downloadImage = async (url) => {
  try {
    const res = await fetch(url)
    const contentType = res.headers.get('content-type')
    const extension = IMAGE_TYPES[contentType?.split(';')[0]]
    if (!res.ok || extension === undefined) {
      return { error: `${res.status} ${contentType}` }
    }
    return { extension, bytes: Buffer.from(await res.arrayBuffer()) }
  } catch (error) {
    return { error: String(error) }
  }
}

const imageUrls = markdown => [...new Set([...markdown.matchAll(/!\[[^\]]*\]\((https?:[^)\s]+)/g)].map(match => match[1]))]

const dropImage = (markdown, url) =>
  markdown.replaceAll(new RegExp(String.raw`!\[[^\]]*\]\(` + RegExp.escape(url) + String.raw`[^)]*\)`, 'g'), '')

/**
 * Links each article's images from public/article-images, storing identical images once under the
 * first article to use them. An image that no longer downloads is already broken on duos.blog, so
 * it is dropped and reported. Returns the rewritten articles and the image files to write.
 */
export const localizeImages = (drafts, imagesByUrl) => {
  const fileByHash = new Map()
  const files = new Map()
  const localized = drafts.map((draft) => {
    let markdown = draft.markdown
    let saved = 0
    for (const url of imageUrls(draft.markdown)) {
      const image = imagesByUrl.get(url)
      if (image.error) {
        console.warn(`Dropped ${url} from ${draft.slug}: ${image.error}`)
        markdown = dropImage(markdown, url)
        continue
      }
      const hash = createHash('sha256').update(image.bytes).digest('hex')
      if (!fileByHash.has(hash)) {
        saved += 1
        fileByHash.set(hash, `${draft.slug}-${saved}.${image.extension}`)
        files.set(fileByHash.get(hash), image.bytes)
      }
      markdown = markdown.replaceAll(url, `/article-images/${fileByHash.get(hash)}`)
    }
    return { ...draft, markdown }
  })
  return { localized, files }
}

/** Removes links with no text, which WordPress content and dropped images leave behind. */
export const removeEmptyLinks = markdown => markdown.replaceAll(/(?<!!)\[\s*\]\([^)]*\)/g, '').replaceAll(/\n{3,}/g, '\n\n')

/** A table pasted without a header row converts with an empty one; its first row becomes the header. */
export const promoteTableHeaders = markdown =>
  markdown.replaceAll(/^\|(?:\s*\|)+\n(\|(?:\s*:?-+:?\s*\|)+)\n(\|.*\|)$/gm, '$2\n$1')

const words = text => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? [])

/**
 * The article page shows the title as its only h1, so a leading h1 or h2 that restates it (sharing
 * most of its words, as "DAC Guide" does "DAC User Guide") is dropped, any other h1 becomes an h2,
 * and bold or italic wrapping a whole heading is removed.
 */
export const fitHeadings = (markdown, title) => {
  let body = markdown.trimStart().replaceAll(/^(#{1,6}) ([*_]{1,2})(.+)\2[ \t]*$/gm, '$1 $3')
  const leading = /^#{1,2} (.+)\n+/.exec(body)
  const titleWords = words(title)
  if (leading && [...titleWords].filter(word => words(leading[1]).has(word)).length * 2 > titleWords.size) {
    body = body.slice(leading[0].length)
  }
  return /^# /m.test(body) ? body.replaceAll(/^(#{1,5}) /gm, '#$1 ') : body
}

const fetchAll = async (type) => {
  const res = await fetch(`${API}?type=${type}&number=100&fields=${FIELDS}`)
  if (!res.ok) {
    throw new Error(`WordPress API returned ${res.status}`)
  }
  const { found, posts } = await res.json()
  if (found > posts.length) {
    throw new Error(`duos.blog has ${found} ${type}s; page through them before importing`)
  }
  return posts
}

const quote = value => `'${String(value).replaceAll('\\', String.raw`\\`).replaceAll('\'', String.raw`\'`)}'`

const formatValue = value => (Array.isArray(value) ? `[${value.map(quote).join(', ')}]` : quote(value))

export const toTypeScript = (articles) => {
  const entries = articles.map((article) => {
    const fields = Object.entries(article)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `    ${key}: ${formatValue(value)},`)
    return `  {\n${fields.join('\n')}\n  },`
  })
  return [
    'import { Article } from \'src/types/article\'',
    '',
    '/**',
    ' * Every article. Each one\'s body is the Markdown file',
    ' * src/content/articles/<category path>/<slug>.md, without a header.',
    ' */',
    `export const ARTICLES: readonly Article[] = [\n${entries.join('\n')}\n]`,
    '',
  ].join('\n')
}

/** Fetches everything first, so a failure leaves the existing content untouched. */
export const runImport = async () => {
  const items = (await Promise.all(['post', 'page'].map(fetchAll))).flat()
    .filter(item => LISTING_REDIRECTS[legacyPath(item.URL)] === undefined)
  const toArticle = item => ({ category: categoryFor(item), slug: slugFor(item) })
  const pathOf = ({ category, slug }) => `/articles/${CATEGORY_PATHS[category]}/${slug}`
  const targetsByPath = new Map([
    ...Object.entries(LISTING_REDIRECTS),
    ...items.map(item => [legacyPath(item.URL), pathOf(toArticle(item))]),
  ])
  const targetsById = new Map(items.map(item => [item.ID, pathOf(toArticle(item))]))
  const convert = createConverter()

  const drafts = items.map((item) => {
    const { category, slug } = toArticle(item)
    const markdown = rewriteLinks(convert(item.content), targetsByPath, targetsById)
    // An untitled page opens with its title as a heading.
    const title = decodeEntities(item.title).trim() || /^#+ (.+)$/m.exec(markdown)?.[1].trim() || slug
    return { item, category, slug, title, markdown: fitHeadings(markdown, title) }
  })
  const urls = [...new Set(drafts.flatMap(draft => imageUrls(draft.markdown)))]
  const images = await Promise.all(urls.map(downloadImage))
  const { localized, files } = localizeImages(drafts, new Map(urls.map((url, index) => [url, images[index]])))

  await Promise.all([CONTENT_DIR, IMAGE_DIR].map(dir => rm(dir, { recursive: true, force: true })))
  const folders = new Set(localized.map(draft => `${CONTENT_DIR}/${CATEGORY_PATHS[draft.category]}`))
  await Promise.all([IMAGE_DIR, ...folders].map(dir => mkdir(dir, { recursive: true })))
  await Promise.all([
    ...[...files].map(([file, bytes]) => writeFile(`${IMAGE_DIR}/${file}`, bytes)),
    ...localized.map(({ category, slug, markdown }) =>
      writeFile(`${CONTENT_DIR}/${CATEGORY_PATHS[category]}/${slug}.md`, `${promoteTableHeaders(removeEmptyLinks(markdown)).trim()}\n`)),
  ])
  const articles = localized.map(({ item, category, slug, title }) => ({
    category,
    slug,
    title,
    excerpt: excerptFrom(item.content),
    publishDate: item.date.slice(0, 10),
    parent: parentFor(item),
    legacyUrl: `https://duos.blog${legacyPath(item.URL)}`,
  }))
  articles.sort((a, b) => a.category.localeCompare(b.category) || b.publishDate.localeCompare(a.publishDate))
  await writeFile(`${CONTENT_DIR}/articles.ts`, toTypeScript(articles))
  console.log(`Imported ${articles.length} articles`)
}

/* v8 ignore start -- the command-line entry point */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runImport()
}
/* v8 ignore stop */
