import React from 'react'
import '@testing-library/jest-dom/vitest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { BlogMarkdown } from 'src/components/blog/BlogMarkdown'
import { Blog } from 'src/libs/ajax/Blog'
import { renderWithRouter } from '../../test-utils'

vi.mock('src/libs/ajax/Blog', () => ({
  Blog: { getImageUrlResolver: vi.fn() },
}))

const renderMarkdown = (markdown: string) => renderWithRouter(<BlogMarkdown markdown={markdown} />)

describe('BlogMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Blog.getImageUrlResolver).mockResolvedValue(imageId => `https://consent.example.org/blog/images/${imageId}`)
  })

  it('resolves duos-image references to the image endpoint', async () => {
    renderMarkdown('![Team photo](duos-image:img-1)')

    const image = await screen.findByRole('img', { name: 'Team photo' })
    await vi.waitFor(() => expect(image).toHaveAttribute('src', 'https://consent.example.org/blog/images/img-1'))
  })

  it('renders GitHub-flavored tables and strikethrough', () => {
    renderMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |\n\n~~gone~~')

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByText('gone').tagName).toBe('DEL')
  })

  it('never renders raw HTML from content', () => {
    const { container } = renderMarkdown('<script>alert(1)</script>\n\n<img src=x onerror="alert(1)">\n\nSafe text')

    expect(container.querySelector('script')).not.toBeInTheDocument()
    expect(container.querySelector('img[onerror]')).not.toBeInTheDocument()
    expect(screen.getByText('Safe text')).toBeInTheDocument()
  })

  it('drops javascript: URLs', () => {
    renderMarkdown('[click](javascript:alert(1))')

    expect(screen.getByText('click').closest('a')).not.toHaveAttribute('href', expect.stringContaining('javascript'))
  })

  it('keeps internal links in the app and opens external links in a new tab', () => {
    renderMarkdown('[Guide](/articles/user-guides/guide) and [Elsewhere](https://example.org)')

    const internal = screen.getByRole('link', { name: 'Guide' })
    expect(internal).toHaveAttribute('href', '/articles/user-guides/guide')
    expect(internal).not.toHaveAttribute('target')

    const external = screen.getByRole('link', { name: 'Elsewhere' })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
