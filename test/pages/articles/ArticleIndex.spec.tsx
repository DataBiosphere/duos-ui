import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ArticleIndex, ARTICLES_PAGE_SIZE } from 'src/pages/articles/ArticleIndex'
import { Blog } from 'src/libs/ajax/Blog'
import type { BlogPostSummary } from 'src/types/blog'

vi.mock('src/libs/ajax/Blog', () => ({
  Blog: { listPublished: vi.fn(), getImageUrlResolver: vi.fn() },
}))

const PUBLISHED = new Date('2026-04-30T12:00:00.000Z').getTime()

const buildArticle = (blogPostId: number, overrides: Partial<BlogPostSummary> = {}): BlogPostSummary => ({
  blogPostId,
  slug: `article-${blogPostId}`,
  title: `Article ${blogPostId}`,
  category: 'BLOG_POST',
  tags: [],
  status: 'PUBLISHED',
  publishDate: PUBLISHED,
  featured: false,
  createDate: PUBLISHED,
  ...overrides,
})

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/articles" element={<ArticleIndex />} />
      <Route path="/articles/:category" element={<ArticleIndex />} />
    </Routes>
  </MemoryRouter>,
)

describe('ArticleIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Blog.getImageUrlResolver).mockResolvedValue(() => undefined)
    vi.mocked(Blog.listPublished).mockResolvedValue({ items: [], total: 0 })
  })

  it('lists every category at /articles, linking each article under its category', async () => {
    vi.mocked(Blog.listPublished).mockResolvedValue({ items: [buildArticle(1, { category: 'POLICY_BRIEF', slug: 'data-use' })], total: 1 })
    renderAt('/articles')

    expect(await screen.findByRole('link', { name: 'Article 1' })).toHaveAttribute('href', '/articles/policy-briefs/data-use')
    expect(Blog.listPublished).toHaveBeenCalledWith({ category: undefined, tag: undefined, page: 0, pageSize: ARTICLES_PAGE_SIZE })
  })

  it('filters by the category in the path and passes the tag and page through', async () => {
    renderAt('/articles/user-guides?tag=researchers&page=2')

    await vi.waitFor(() => expect(Blog.listPublished).toHaveBeenCalledWith({ category: 'USER_GUIDE', tag: 'researchers', page: 1, pageSize: ARTICLES_PAGE_SIZE }))
    expect(screen.getByRole('tab', { name: 'User Guides' })).toHaveAttribute('aria-selected', 'true')
  })

  it('gives every category tab its own URL', () => {
    renderAt('/articles')

    expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('href', '/articles')
    expect(screen.getByRole('tab', { name: 'Feature Announcements' })).toHaveAttribute('href', '/articles/feature-announcements')
    expect(screen.getByRole('tab', { name: 'In the News' })).toHaveAttribute('href', '/articles/in-the-news')
  })

  it('shows not found for an unknown category without asking the server', () => {
    renderAt('/articles/recipes')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    expect(Blog.listPublished).not.toHaveBeenCalled()
  })
})
