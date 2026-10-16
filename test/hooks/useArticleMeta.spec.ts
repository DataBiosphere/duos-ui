import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useArticleMeta } from 'src/hooks/useArticleMeta'
import type { Article } from 'src/types/article'

const guide: Article = { category: 'USER_GUIDE', slug: 'dac-guide', title: 'DAC Guide', excerpt: 'For DACs', publishDate: '2024-03-01' }
const faq: Article = { ...guide, slug: 'faqs', title: 'FAQs', excerpt: 'Common questions' }

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')

describe('useArticleMeta', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    document.title = ''
  })

  it('sets the article\'s tags, follows a change of article and removes them on leaving', () => {
    const { rerender, unmount } = renderHook(({ article }) => useArticleMeta(article), { initialProps: { article: guide } })

    expect(canonical()).toBe('https://duos.org/articles/user-guides/dac-guide')
    expect(document.head.querySelectorAll('[data-article-meta]')).toHaveLength(7)
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', 'For DACs')
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'DAC Guide')

    rerender({ article: faq })
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(canonical()).toBe('https://duos.org/articles/user-guides/faqs')

    unmount()
    expect(document.head.querySelectorAll('[data-article-meta]')).toHaveLength(0)
  })

  it('replaces a prebuilt page\'s tags and title', () => {
    document.head.innerHTML = '<link rel="canonical" href="https://duos.org/articles/pages/help" data-article-meta><meta name="keep">'
    document.title = 'Help | DUOS'

    renderHook(() => useArticleMeta(guide))

    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1)
    expect(canonical()).toBe('https://duos.org/articles/user-guides/dac-guide')
    expect(document.head.querySelector('meta[name="keep"]')).toBeInTheDocument()
    expect(document.title).toBe('DUOS')
  })

  it('only clears prebuilt tags when there is no article', () => {
    document.head.innerHTML = '<meta name="description" content="Help" data-article-meta>'

    renderHook(() => useArticleMeta(undefined))

    expect(document.head.querySelectorAll('[data-article-meta]')).toHaveLength(0)
  })
})
