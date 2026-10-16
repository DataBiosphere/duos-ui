import { afterEach, describe, expect, it, vi } from 'vitest'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import {
  categoryFor,
  createConverter,
  decodeEntities,
  excerptFrom,
  fitHeadings,
  localizeImages,
  parentFor,
  promoteTableHeaders,
  removeEmptyLinks,
  rewriteLinks,
  runImport,
  slugFor,
  toTypeScript,
} from '../../scripts/import-duos-blog.mjs'

vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(), rm: vi.fn(), writeFile: vi.fn() }))

const page = (path: string) => ({ type: 'page', URL: `http://duos.blog${path}` })
const post = (tags: string[]) => ({ type: 'post', URL: 'http://duos.blog/2025/01/01/x/', tags: Object.fromEntries(tags.map(tag => [tag, {}])) })

describe('import-duos-blog', () => {
  it('assigns categories from the page path or the post tag', () => {
    expect(categoryFor(page('/help/dacguide/'))).toBe('USER_GUIDE')
    expect(categoryFor(page('/help/'))).toBe('PAGE')
    expect(categoryFor(page('/feature-announcements/progressreports/'))).toBe('FEATURE_ANNOUNCEMENT')
    expect(categoryFor(page('/aboutduos/'))).toBe('PAGE')
    expect(categoryFor(post(['User Guides']))).toBe('USER_GUIDE')
    expect(categoryFor(post(['Feature']))).toBe('FEATURE_ANNOUNCEMENT')
    expect(categoryFor(post(['Policy']))).toBe('POLICY_BRIEF')
    expect(categoryFor(post(['Article']))).toBe('IN_THE_NEWS')
    expect(categoryFor(post([]))).toBe('BLOG_POST')
    expect(categoryFor({ type: 'post', URL: 'http://duos.blog/x/' })).toBe('BLOG_POST')
  })

  it('normalizes slugs and nests help pages under Help', () => {
    expect(slugFor({ slug: 'link_institutional_email_to_gmail' })).toBe('link-institutional-email-to-gmail')
    expect(slugFor({ slug: 'hello-world' })).toBe('nih-genomic-data-sharing-policy-update')
    expect(parentFor(page('/help/nih_ras/'))).toBe('help')
    expect(parentFor(page('/help/'))).toBeUndefined()
  })

  it('decodes entities and cuts excerpts at a word', () => {
    expect(decodeEntities('&#8220;Data&#8221; &amp; more&hellip; &#x2019; &bogus;')).toBe('“Data” & more… ’ &bogus;')
    const paragraph = 'DACs must answer important questions about access to data before approving requests.'
    expect(excerptFrom(`<h2>Guide</h2><p>Short caption</p><p>${paragraph}</p>`)).toBe(paragraph)
    expect(excerptFrom(`<p>${paragraph}</p>`, 20)).toBe('DACs must answer…')
    expect(excerptFrom('<p>\u200Bshort <strong>card</strong>.<br>Next</p>')).toBe('short card. Next')
  })

  it('points duos.blog links at the migrated articles', () => {
    const byPath = new Map([['/help/dacguide/', '/articles/user-guides/dacguide'], ['/', '/articles']])
    const byId = new Map([[3, '/articles/pages/help']])
    const markdown = '[a](http://duos.blog/help/dacguide/#faq) [b](https://duos.blog/help/dacguide) [c](http://duos.blog/?post_type=page&p=3) [d](https://duos.blog) [e](https://duos.blog/gone/)'

    expect(rewriteLinks(markdown, byPath, byId))
      .toBe('[a](/articles/user-guides/dacguide#faq) [b](/articles/user-guides/dacguide) [c](/articles/pages/help) [d](/articles) [e](https://duos.blog/gone/)')
  })

  it('drops a leading heading that restates the title and keeps a single h1', () => {
    expect(fitHeadings('# About DUOS\n\nText\n\n# Part\n\n## Sub', 'About DUOS')).toBe('Text\n\n## Part\n\n### Sub')
    expect(fitHeadings('## Data Access Committee (DAC) Guide\n\nText', 'DAC User Guide')).toBe('Text')
    expect(fitHeadings('## Overview\n\nText', 'NIH RAS in DUOS')).toBe('## Overview\n\nText')
    expect(fitHeadings('### **At a Glance**\n\nText', 'Progress Reports')).toBe('### At a Glance\n\nText')
    expect(fitHeadings('## Intro\n\nText', '***')).toBe('## Intro\n\nText')
  })

  it('removes empty links and promotes a table\'s first row into an empty header', () => {
    expect(removeEmptyLinks('Intro [](https://example.org/a)\n\n\n\n[x](/y) ![](/img.png)')).toBe('Intro \n\n[x](/y) ![](/img.png)')
    expect(promoteTableHeaders('|     |     |\n| --- | --- |\n| **Role** | **Use** |\n| DAC | Review |'))
      .toBe('| **Role** | **Use** |\n| --- | --- |\n| DAC | Review |')
  })

  it('converts HTML, turning YouTube embeds into links and keeping tables', () => {
    const convert = createConverter()

    expect(convert('<p>Hi</p><iframe src="https://www.youtube.com/embed/abc_1?rel=1"></iframe><iframe></iframe><script>x()</script>'))
      .toBe('Hi\n\n[Watch the video on YouTube](https://www.youtube.com/watch?v=abc_1)')
    expect(convert('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'))
      .toMatch(/^\| A +\|\n\| --- \|/)
  })

  it('writes the article list as TypeScript, escaping quotes and skipping unset fields', () => {
    const source = toTypeScript([{ category: 'PAGE', slug: 'help', title: 'DUOS\'s help', parent: undefined, tags: ['a'] }])

    expect(source).toContain('    title: \'DUOS\\\'s help\',\n    tags: [\'a\'],\n')
    expect(source).not.toContain('parent')
  })
})

const png = (bytes: number[]) => ({ extension: 'png', bytes: Buffer.from(bytes) })

describe('localizeImages', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names images after the first article to use them, stores duplicates once and drops dead ones', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const drafts = [
      { slug: 'first', markdown: '![a](https://img/a.png) ![b](https://img/b.png)' },
      { slug: 'second', markdown: '[![dead](https://img/dead.png)](https://img/dead.png) ![copy](https://img/copy.png)' },
    ]
    const images = new Map<string, object>([
      ['https://img/a.png', png([1])],
      ['https://img/b.png', png([2])],
      ['https://img/copy.png', png([1])],
      ['https://img/dead.png', { error: '404 text/html' }],
    ])

    const { localized, files } = localizeImages(drafts, images)

    expect(localized.map((draft: { markdown: string }) => draft.markdown)).toEqual([
      '![a](/article-images/first-1.png) ![b](/article-images/first-2.png)',
      '[](https://img/dead.png) ![copy](/article-images/first-1.png)',
    ])
    expect([...files.keys()]).toEqual(['first-1.png', 'first-2.png'])
    expect(console.warn).toHaveBeenCalledWith('Dropped https://img/dead.png from second: 404 text/html')
  })
})

const wordpressPost = {
  ID: 7,
  URL: 'http://duos.blog/2025/01/01/hello-world/',
  slug: 'hello-world',
  title: 'Policy &amp; you',
  date: '2025-01-01T09:00:00',
  type: 'post',
  tags: { Policy: {} },
  content: '<p>Read the <a href="http://duos.blog/help/">help</a> about policy for researchers and their DACs.</p><p><img src="https://img/ok.png"><img src="https://img/gone.png"><img src="https://img/broken.png"><img src="https://img/page.png"></p>',
}
const wordpressPages = [
  { ID: 3, URL: 'http://duos.blog/help/', slug: 'help', title: '', date: '2024-02-02T00:00:00', type: 'page', content: '<h1>Help Center</h1><p>Guides for every DUOS role and the questions people ask most.</p>' },
  { ID: 1, URL: 'http://duos.blog/', slug: 'home', title: 'Home', date: '2024-01-01T00:00:00', type: 'page', content: '<p>Listing</p>' },
  { ID: 4, URL: 'http://duos.blog/untitled/', slug: 'untitled', title: '', date: '2024-03-03T00:00:00', type: 'page', content: '<p>A page that WordPress saved with neither a title nor a heading.</p>' },
]

const respond = (body: unknown, init: { ok?: boolean, status?: number, type?: string } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  headers: new Headers({ 'content-type': init.type ?? 'application/json' }),
  json: () => Promise.resolve(body),
  arrayBuffer: () => Promise.resolve(new Uint8Array([9]).buffer),
})

const stubWordPress = (overrides: Record<string, () => unknown> = {}) => vi.stubGlobal('fetch', vi.fn((url: string) => {
  const override = Object.keys(overrides).find(key => url.includes(key))
  if (override) {
    return overrides[override]()
  }
  if (url.includes('type=post')) {
    return Promise.resolve(respond({ found: 1, posts: [wordpressPost] }))
  }
  if (url.includes('type=page')) {
    return Promise.resolve(respond({ found: 3, posts: wordpressPages }))
  }
  if (url.endsWith('ok.png')) {
    return Promise.resolve(respond(null, { type: 'image/png' }))
  }
  if (url.endsWith('gone.png')) {
    return Promise.resolve(respond(null, { ok: false, status: 404, type: 'image/png' }))
  }
  if (url.endsWith('page.png')) {
    return Promise.resolve(respond(null, { type: 'text/html' }))
  }
  return Promise.reject(new Error('network down'))
}))

const written = () => Object.fromEntries(vi.mocked(writeFile).mock.calls.map(([path, data]) => [path, String(data)]))

describe('runImport', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('writes each article, its images and the article list', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    stubWordPress()

    await runImport()

    expect(rm).toHaveBeenCalledWith('src/content/articles', { recursive: true, force: true })
    expect(mkdir).toHaveBeenCalledWith('src/content/articles/policy-briefs', { recursive: true })
    const files = written()
    expect(Object.keys(files).sort()).toEqual([
      'public/article-images/nih-genomic-data-sharing-policy-update-1.png',
      'src/content/articles/articles.ts',
      'src/content/articles/pages/help.md',
      'src/content/articles/pages/untitled.md',
      'src/content/articles/policy-briefs/nih-genomic-data-sharing-policy-update.md',
    ])
    expect(files['src/content/articles/policy-briefs/nih-genomic-data-sharing-policy-update.md'])
      .toBe('Read the [help](/articles/pages/help) about policy for researchers and their DACs.\n\n![](/article-images/nih-genomic-data-sharing-policy-update-1.png)\n')
    expect(files['src/content/articles/pages/help.md']).toBe('Guides for every DUOS role and the questions people ask most.\n')
    expect(files['src/content/articles/articles.ts']).toContain(`    category: 'PAGE',
    slug: 'help',
    title: 'Help Center',`)
    expect(files['src/content/articles/articles.ts']).toContain('    title: \'Policy & you\',')
    expect(files['src/content/articles/articles.ts'].indexOf('slug: \'untitled\',\n    title: \'untitled\''))
      .toBeLessThan(files['src/content/articles/articles.ts'].indexOf('slug: \'help\''))
    expect(files['src/content/articles/articles.ts'].indexOf('slug: \'help\''))
      .toBeLessThan(files['src/content/articles/articles.ts'].indexOf('slug: \'nih-genomic-data-sharing-policy-update\''))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('https://img/broken.png'))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('https://img/gone.png from nih-genomic-data-sharing-policy-update: 404 image/png'))
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('https://img/page.png from nih-genomic-data-sharing-policy-update: 200 text/html'))
    expect(console.log).toHaveBeenCalledWith('Imported 3 articles')
  })

  it('stops before touching the content when WordPress fails or has more than one page of results', async () => {
    stubWordPress({ 'type=post': () => Promise.resolve(respond(null, { ok: false, status: 503 })) })
    await expect(runImport()).rejects.toThrow('WordPress API returned 503')

    stubWordPress({ 'type=page': () => Promise.resolve(respond({ found: 150, posts: wordpressPages })) })
    await expect(runImport()).rejects.toThrow('duos.blog has 150 pages; page through them before importing')
    expect(rm).not.toHaveBeenCalled()
  })
})
