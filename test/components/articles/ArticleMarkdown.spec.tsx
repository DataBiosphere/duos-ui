import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { ArticleMarkdown } from 'src/components/articles/ArticleMarkdown'
import { renderWithRouter } from '../../test-utils'

const renderMarkdown = (markdown: string) => renderWithRouter(<ArticleMarkdown markdown={markdown} />)

describe('ArticleMarkdown', () => {
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
    expect(internal).toHaveAttribute('data-discover')

    const external = screen.getByRole('link', { name: 'Elsewhere' })
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('keeps footnotes, anchors and mail links in the same tab', () => {
    renderMarkdown('Claim[^1] and [mail](mailto:help@example.org)\n\n[^1]: Source')

    expect(screen.getByRole('link', { name: '1' })).not.toHaveAttribute('target')
    expect(screen.getByRole('link', { name: 'mail' })).not.toHaveAttribute('target')
  })

  it('loads site files directly rather than through the app router', () => {
    renderMarkdown('[Full size](/article-images/chart.png) and [Report](/article-images/report.pdf?v=2)')

    for (const name of ['Full size', 'Report']) {
      const link = screen.getByRole('link', { name })
      expect(link).not.toHaveAttribute('target')
      expect(link).not.toHaveAttribute('data-discover')
    }
  })

  it('lazy-loads images and gives them alt text', () => {
    renderMarkdown('![Team photo](https://example.org/team.png)')

    expect(screen.getByRole('img', { name: 'Team photo' })).toHaveAttribute('loading', 'lazy')
  })
})
