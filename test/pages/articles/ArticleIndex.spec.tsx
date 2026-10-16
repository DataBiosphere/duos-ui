import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { ArticleIndex } from 'src/pages/articles/ArticleIndex'
import type { Article } from 'src/types/article'

const { articles } = vi.hoisted(() => {
  const guides: Article[] = Array.from({ length: 13 }, (_, index) => ({
    category: 'USER_GUIDE',
    slug: `guide-${index + 1}`,
    title: `Guide ${index + 1}`,
    excerpt: 'A guide',
    publishDate: `2024-01-${String(index + 1).padStart(2, '0')}`,
    tags: ['guide'],
  }))
  const others: Article[] = [
    { category: 'BLOG_POST', slug: 'featured', title: 'Featured post', excerpt: 'Read this first', publishDate: '2020-01-01', featured: true, tags: ['dac'], author: 'DUOS Team' },
    { category: 'BLOG_POST', slug: 'tagged', title: 'Tagged post', excerpt: 'About DACs', publishDate: '2023-06-01', tags: ['dac'] },
    { category: 'BLOG_POST', slug: 'draft', title: 'Draft post', excerpt: 'Not ready', publishDate: '2023-01-01', draft: true },
    { category: 'BLOG_POST', slug: 'scheduled', title: 'Scheduled post', excerpt: 'Coming soon', publishDate: '2999-01-01' },
  ]
  return { articles: [...guides, ...others] }
})

vi.mock('src/content/articles/articles', () => ({ ARTICLES: articles }))

const renderAt = (path: string) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/articles" element={<ArticleIndex />} />
      <Route path="/articles/:category" element={<ArticleIndex />} />
    </Routes>
  </MemoryRouter>,
)

const titles = () => screen.queryAllByRole('heading', { level: 2 }).map(heading => heading.textContent)

describe('ArticleIndex', () => {
  it('shows a featured article first and hides drafts and scheduled articles', () => {
    renderAt('/articles/blog-posts')

    expect(titles()).toEqual(['Featured post', 'Tagged post'])
    expect(screen.getByText('By DUOS Team')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Blog Posts' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('tab', { name: 'All' })).not.toHaveAttribute('aria-current')
  })

  it('filters by tag and clears the filter', async () => {
    renderAt('/articles?tag=dac')

    expect(titles()).toEqual(['Featured post', 'Tagged post'])
    await userEvent.click(screen.getByTestId('CancelIcon'))
    expect(titles()).toHaveLength(12)
  })

  it('pages through a category, newest first', async () => {
    renderAt('/articles/user-guides')

    expect(titles()).toHaveLength(12)
    expect(titles()[0]).toBe('Guide 13')
    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(titles()).toEqual(['Guide 1'])
  })

  it('keeps the tag filter when paging', async () => {
    renderAt('/articles?tag=guide')

    await userEvent.click(screen.getByRole('button', { name: 'Go to page 2' }))
    expect(titles()).toEqual(['Guide 1'])
  })

  it('keeps the page number in range', () => {
    renderAt('/articles/user-guides?page=99')

    expect(titles()).toEqual(['Guide 1'])
  })

  it('says so when a category has no articles', () => {
    renderAt('/articles/policy-briefs')

    expect(screen.getByText(/No articles here yet/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'pagination navigation' })).not.toBeInTheDocument()
  })

  it('shows not found for an unknown category', () => {
    renderAt('/articles/unknown')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })
})
