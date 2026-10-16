import { afterEach, describe, expect, it, vi } from 'vitest'
import { Article } from 'src/types/article'
import {
  articleBodyFile,
  articlePath,
  categoryFromPath,
  fetchArticleBody,
  isArticleVisible,
  pageNumber,
  readingTimeMinutes,
  validateArticles,
} from 'src/utils/ArticleUtils'

const guide: Article = {
  category: 'USER_GUIDE',
  slug: 'dac-guide',
  title: 'DAC Guide',
  excerpt: 'How DACs review requests',
  publishDate: '2024-03-01',
}

const guideFile = '/src/content/articles/user-guides/dac-guide.md'

describe('article paths', () => {
  it('builds the public URL and body file from the category and slug', () => {
    expect(articlePath(guide)).toBe('/articles/user-guides/dac-guide')
    expect(articleBodyFile(guide)).toBe(guideFile)
  })

  it('maps a URL segment back to its category', () => {
    expect(categoryFromPath('in-the-news')).toBe('IN_THE_NEWS')
    expect(categoryFromPath('unknown')).toBeUndefined()
    expect(categoryFromPath(undefined)).toBeUndefined()
  })
})

describe('isArticleVisible', () => {
  const now = Date.parse('2024-03-01T12:00:00Z')

  it('shows an article from its publish date', () => {
    expect(isArticleVisible(guide, now)).toBe(true)
    expect(isArticleVisible({ ...guide, publishDate: '2024-03-02' }, now)).toBe(false)
  })

  it('hides drafts', () => {
    expect(isArticleVisible({ ...guide, draft: true }, now)).toBe(false)
  })
})

describe('validateArticles', () => {
  it('accepts an index that matches its body files', () => {
    expect(validateArticles([guide], [guideFile])).toEqual([])
  })

  it('reports invalid fields', () => {
    const bad: Article = { ...guide, slug: 'Bad Slug', title: ' ', excerpt: '', publishDate: '2024-3-1', legacyUrl: 'http://duos.blog/x/' }

    expect(validateArticles([bad], ['/src/content/articles/user-guides/Bad Slug.md'])).toEqual([
      '/articles/user-guides/Bad Slug: slug must be lowercase words joined by hyphens',
      '/articles/user-guides/Bad Slug: title is empty',
      '/articles/user-guides/Bad Slug: excerpt is empty',
      '/articles/user-guides/Bad Slug: publishDate must be a YYYY-MM-DD date',
      '/articles/user-guides/Bad Slug: legacyUrl must be an https URL',
    ])
  })

  it.each(['2024-13-40', '2025-02-29', '2024-04-31'])('rejects the impossible date %s', (publishDate) => {
    expect(validateArticles([{ ...guide, publishDate }], [guideFile]))
      .toEqual(['/articles/user-guides/dac-guide: publishDate must be a YYYY-MM-DD date'])
  })

  it('reports a parent that is not a page and a reused legacy URL', () => {
    const legacyUrl = 'https://duos.blog/help/dacguide/'
    const help: Article = { ...guide, category: 'PAGE', slug: 'help' }
    const child: Article = { ...guide, slug: 'child', parent: 'help', legacyUrl }
    const orphan: Article = { ...guide, slug: 'orphan', parent: 'dac-guide', legacyUrl }
    const files = [help, child, orphan].map(articleBodyFile)

    expect(validateArticles([help, child, orphan], files)).toEqual([
      '/articles/user-guides/orphan: parent dac-guide is not a page',
      `/articles/user-guides/orphan: legacyUrl ${legacyUrl} is used by another article`,
    ])
  })

  it('reports duplicates, missing bodies and unlisted files', () => {
    const page: Article = { ...guide, category: 'PAGE' }

    expect(validateArticles([guide, guide, page], [guideFile, '/src/content/articles/pages/orphan.md'])).toEqual([
      '/articles/user-guides/dac-guide: listed more than once',
      '/articles/pages/dac-guide: missing /src/content/articles/pages/dac-guide.md',
      '/src/content/articles/pages/orphan.md: not listed in articles.ts',
    ])
  })
})

describe('fetchArticleBody', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches the body from its asset URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('# DAC Guide') })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchArticleBody(guide, { [guideFile]: '/assets/dac-guide.md' })).resolves.toBe('# DAC Guide')
    expect(fetchMock).toHaveBeenCalledWith('/assets/dac-guide.md')
  })

  it('rejects a failed response or an article without a body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))

    await expect(fetchArticleBody(guide, { [guideFile]: '/assets/dac-guide.md' }))
      .rejects.toThrow('Failed to load /articles/user-guides/dac-guide: 404')
    await expect(fetchArticleBody(guide, {})).rejects.toThrow('No body for /articles/user-guides/dac-guide')
  })
})

describe('article listing helpers', () => {
  it('estimates reading time at 200 words a minute', () => {
    expect(readingTimeMinutes('word '.repeat(600))).toBe(3)
  })
})

describe('pageNumber', () => {
  it.each([
    [null, 3, 1],
    ['9', 3, 3],
    ['2.7', 3, 2],
    ['abc', 0, 1],
  ])('reads %s with %i pages as page %i', (param, pageCount, expected) => {
    expect(pageNumber(param, pageCount)).toBe(expected)
  })
})
