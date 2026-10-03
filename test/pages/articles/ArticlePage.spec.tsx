import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ArticlePage } from 'src/pages/articles/ArticlePage'
import { Blog } from 'src/libs/ajax/Blog'
import type { BlogPost } from 'src/types/blog'

vi.mock('src/libs/ajax/Blog', () => ({
  Blog: { getPublished: vi.fn(), getImageUrlResolver: vi.fn() },
}))

const PUBLISHED = new Date('2026-04-30T12:00:00.000Z').getTime()

const article: BlogPost = {
  blogPostId: 1,
  slug: 'researcher-guide',
  title: 'Researcher Guide',
  contentMd: '## Getting started\n\nRequest a library card.',
  category: 'USER_GUIDE',
  tags: ['researchers'],
  status: 'PUBLISHED',
  publishDate: PUBLISHED,
  featured: false,
  authorDisplayName: 'DUOS Team',
  parentSlug: 'help',
  createDate: PUBLISHED,
  updateDate: PUBLISHED,
}

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/articles/:category/:slug" element={<ArticlePage />} />
    </Routes>
  </MemoryRouter>,
)

describe('ArticlePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Blog.getImageUrlResolver).mockResolvedValue(() => undefined)
  })

  it('loads the article by category and slug and renders it', async () => {
    vi.mocked(Blog.getPublished).mockResolvedValue(article)
    renderAt('/articles/user-guides/researcher-guide')

    expect(await screen.findByRole('heading', { level: 1, name: 'Researcher Guide' })).toBeInTheDocument()
    expect(Blog.getPublished).toHaveBeenCalledWith('USER_GUIDE', 'researcher-guide')
    expect(screen.getByText(/By DUOS Team/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument()
  })

  it('links the breadcrumb to all articles and to the category', async () => {
    vi.mocked(Blog.getPublished).mockResolvedValue(article)
    renderAt('/articles/user-guides/researcher-guide')

    await screen.findByRole('heading', { level: 1, name: 'Researcher Guide' })
    expect(screen.getByRole('link', { name: 'Articles' })).toHaveAttribute('href', '/articles')
    expect(screen.getByRole('link', { name: 'User Guides' })).toHaveAttribute('href', '/articles/user-guides')
    expect(screen.getByText('Help')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'researchers' })).toHaveAttribute('href', '/articles?tag=researchers')
  })

  it('shows not found for a missing or unpublished article', async () => {
    vi.mocked(Blog.getPublished).mockRejectedValue(Object.assign(new Error('Not found'), { response: { status: 404 } }))
    renderAt('/articles/user-guides/draft-article')

    expect(await screen.findByRole('heading', { name: 'Article not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to articles' })).toHaveAttribute('href', '/articles')
  })

  it('shows not found for an unknown category without asking the server', () => {
    renderAt('/articles/recipes/researcher-guide')

    expect(screen.getByRole('heading', { name: 'Article not found' })).toBeInTheDocument()
    expect(Blog.getPublished).not.toHaveBeenCalled()
  })

  it('distinguishes a server failure from a missing article', async () => {
    vi.mocked(Blog.getPublished).mockRejectedValue(Object.assign(new Error('Server error'), { response: { status: 500 } }))
    renderAt('/articles/user-guides/researcher-guide')

    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
  })
})
