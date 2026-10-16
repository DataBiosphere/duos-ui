import React from 'react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { ArticlePage } from 'src/pages/articles/ArticlePage'
import { fetchArticleBody } from 'src/utils/ArticleUtils'
import type { Article } from 'src/types/article'

const { articles } = vi.hoisted(() => ({
  articles: [
    { category: 'BLOG_POST', slug: 'help', title: 'Help post', excerpt: 'Not the parent', publishDate: '2020-01-01' },
    { category: 'PAGE', slug: 'help', title: 'Help', excerpt: 'Help pages', publishDate: '2020-01-01' },
    { category: 'USER_GUIDE', slug: 'dac-guide', title: 'DAC Guide', excerpt: 'For DACs', publishDate: '2024-03-01', author: 'DUOS Team', parent: 'help', tags: ['dac'] },
    { category: 'USER_GUIDE', slug: 'draft', title: 'Draft', excerpt: 'Not ready', publishDate: '2024-03-01', draft: true },
  ] as Article[],
}))

vi.mock('src/content/articles/articles', () => ({ ARTICLES: articles }))

vi.mock('src/utils/ArticleUtils', async importOriginal => ({
  ...await importOriginal<typeof import('src/utils/ArticleUtils')>(),
  fetchArticleBody: vi.fn(),
}))

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Link to="/articles/pages/help">Go to Help</Link>
    <Routes>
      <Route path="/articles/:category/:slug" element={<ArticlePage />} />
    </Routes>
  </MemoryRouter>,
)

describe('ArticlePage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the article with its byline, breadcrumb and tags', async () => {
    vi.mocked(fetchArticleBody).mockResolvedValue('Reviewing **requests**.')
    renderAt('/articles/user-guides/dac-guide')

    expect(await screen.findByText('requests')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'DAC Guide' })).toBeInTheDocument()
    expect(screen.getByText('By DUOS Team · March 1, 2024 · 1 min read')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'User Guides' })).toHaveAttribute('href', '/articles/user-guides')
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/articles/pages/help')
    expect(screen.getByRole('link', { name: 'dac' })).toHaveAttribute('href', '/articles?tag=dac')
    expect(document.title).toBe('DAC Guide | DUOS')
  })

  it.each([
    ['an unknown article', '/articles/user-guides/missing'],
    ['a draft', '/articles/user-guides/draft'],
    ['an unknown category', '/articles/unknown/dac-guide'],
  ])('shows not found for %s', (_case, path) => {
    renderAt(path)

    expect(screen.getByRole('heading', { name: 'Article not found' })).toBeInTheDocument()
    expect(fetchArticleBody).not.toHaveBeenCalled()
  })

  it('shows loading, then the new body, when moving to another article', async () => {
    let resolveHelp = (_body: string) => {}
    vi.mocked(fetchArticleBody)
      .mockResolvedValueOnce('Body of dac-guide')
      .mockReturnValueOnce(new Promise((resolve) => { resolveHelp = resolve }))
    renderAt('/articles/user-guides/dac-guide')
    expect(screen.getByRole('progressbar', { name: 'Loading article' })).toBeInTheDocument()
    expect(await screen.findByText('Body of dac-guide')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Help' }))

    expect(screen.getByRole('progressbar', { name: 'Loading article' })).toBeInTheDocument()
    resolveHelp('Body of help')
    expect(await screen.findByText('Body of help')).toBeInTheDocument()
  })

  it('ignores a body that arrives after leaving the article', async () => {
    let resolveGuide = (_body: string) => {}
    vi.mocked(fetchArticleBody)
      .mockReturnValueOnce(new Promise((resolve) => { resolveGuide = resolve }))
      .mockResolvedValueOnce('Body of help')
    renderAt('/articles/user-guides/dac-guide')

    await userEvent.click(screen.getByRole('link', { name: 'Go to Help' }))
    expect(await screen.findByText('Body of help')).toBeInTheDocument()
    await act(async () => resolveGuide('Body of dac-guide'))

    expect(screen.getByText('Body of help')).toBeInTheDocument()
    expect(screen.queryByText('Body of dac-guide')).not.toBeInTheDocument()
  })

  it('says so when the body fails to load', async () => {
    vi.mocked(fetchArticleBody).mockRejectedValue(new Error('offline'))
    renderAt('/articles/user-guides/dac-guide')

    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })
})
