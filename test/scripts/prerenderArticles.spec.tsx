import { mkdirSync, mkdtempSync, readFileSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { articlePageHtml, prerenderArticles, renderMarkdown, sitemapXml } from '../../scripts/prerender-articles'
import type { Article } from 'src/types/article'

const INDEX_HTML = '<html><head>\n  <title>DUOS</title>\n</head><body><div id="root"></div><script src="/assets/app.js"></script></body></html>'

const guide: Article = { category: 'USER_GUIDE', slug: 'dac-guide', title: 'DAC "Guide" & more', excerpt: 'For <DACs>', publishDate: '2024-03-01' }

describe('prerender-articles', () => {
  const dirs: string[] = []
  afterEach(() => {
    dirs.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true }))
  })

  it('renders Markdown with tables and without raw HTML', () => {
    const html = renderMarkdown('| A |\n| --- |\n| 1 |\n\n<script>alert(1)</script>')

    expect(html).toContain('<table>')
    expect(html).not.toContain('<script>')
  })

  it('puts the escaped title, description and canonical URL in the head and the content in #root', () => {
    const page = articlePageHtml(INDEX_HTML, guide, '<p>Body</p>')

    expect(page).toContain('<title>DAC &quot;Guide&quot; &amp; more | DUOS</title>')
    expect(page).toContain('<meta name="description" content="For &lt;DACs&gt;" data-article-meta>')
    expect(page).toContain('<link rel="canonical" href="https://duos.org/articles/user-guides/dac-guide" data-article-meta>')
    expect(page).toContain('<meta property="og:url" content="https://duos.org/articles/user-guides/dac-guide" data-article-meta>')
    expect(page).toContain('<div id="root"><main><article><h1>DAC &quot;Guide&quot; &amp; more</h1><p>Body</p></article></main></div>')
    expect(page).toContain('<script src="/assets/app.js"></script>')
    expect(page).not.toContain('<title>DUOS</title>')
  })

  it('keeps a $ in the content literal', () => {
    const page = articlePageHtml(INDEX_HTML, { ...guide, title: 'Costs $$ and $&' }, '<p>$\' stays</p>')

    expect(page).toContain('<h1>Costs $$ and $&amp;</h1><p>$\' stays</p></article></main></div><script')
  })

  it('lists the article index, every category and each article in the sitemap', () => {
    const sitemap = sitemapXml([guide])

    expect(sitemap).toContain('<url><loc>https://duos.org/articles</loc></url>')
    expect(sitemap).toContain('<url><loc>https://duos.org/articles/policy-briefs</loc></url>')
    expect(sitemap).toContain('<url><loc>https://duos.org/articles/user-guides/dac-guide</loc><lastmod>2024-03-01</lastmod></url>')
    expect(sitemap.match(/<url>/g)).toHaveLength(8)
  })

  it('writes a page and a sitemap entry for each visible article only', async () => {
    const buildDir = mkdtempSync(path.join(tmpdir(), 'build-'))
    const contentDir = mkdtempSync(path.join(tmpdir(), 'content-'))
    dirs.push(buildDir, contentDir)
    writeFileSync(path.join(buildDir, 'index.html'), INDEX_HTML)
    mkdirSync(path.join(contentDir, 'articles', 'user-guides'), { recursive: true })
    writeFileSync(path.join(contentDir, 'articles', 'user-guides', 'dac-guide.md'), 'Reviewing **requests**.')
    const hidden: Article[] = [{ ...guide, slug: 'draft', draft: true }, { ...guide, slug: 'later', publishDate: '2024-04-01' }]

    const count = await prerenderArticles({ buildDir, contentDir, articles: [guide, ...hidden], now: Date.parse('2024-03-15') })

    expect(count).toBe(1)
    expect(readFileSync(path.join(buildDir, 'articles', 'user-guides', 'dac-guide.html'), 'utf8')).toContain('<p>Reviewing <strong>requests</strong>.</p>')
    expect(existsSync(path.join(buildDir, 'articles', 'user-guides', 'draft.html'))).toBe(false)
    const sitemap = readFileSync(path.join(buildDir, 'sitemap.xml'), 'utf8')
    expect(sitemap).toContain('/articles/user-guides/dac-guide<')
    expect(sitemap).not.toContain('/articles/user-guides/later')
  })
})
