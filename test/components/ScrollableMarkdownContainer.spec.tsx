import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ScrollableMarkdownContainer from 'src/components/ScrollableMarkdownContainer'

type MarkdownComponents = {
  a?: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement>>
}

vi.mock('react-markdown', () => ({
  default: ({ children, components }: { children: string, components?: MarkdownComponents }) => {
    const A = components?.a
    return A
      ? <A href="https://example.com" data-testid="markdown-link">{children}</A>
      : <span data-testid="markdown">{children}</span>
  },
}))

vi.mock('dompurify', () => ({
  default: { sanitize: (text: string) => text },
}))

const mockFetch = (content: string) => {
  global.fetch = vi.fn().mockResolvedValue({
    text: () => Promise.resolve(content),
  } as unknown as Response)
}

describe('ScrollableMarkdownContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the scrollable container with correct styles', async () => {
    mockFetch('# Hello')

    let container: HTMLElement
    await act(async () => {
      ;({ container } = render(<ScrollableMarkdownContainer markdown="/test.md" />))
    })

    const div = container!.firstChild as HTMLElement
    expect(div.style.maxWidth).toBe('700px')
    expect(div.style.minWidth).toBe('700px')
    expect(div.style.maxHeight).toBe('200px')
    expect(div.style.overflow).toBe('auto')
    expect(div.style.marginBottom).toBe('25px')
  })

  it('fetches the markdown url and renders sanitized content', async () => {
    const markdownContent = '# Heading'
    mockFetch(markdownContent)

    await act(async () => {
      render(<ScrollableMarkdownContainer markdown="/content.md" />)
    })

    expect(global.fetch).toHaveBeenCalledWith('/content.md')
    expect(screen.getByTestId('markdown-link').textContent).toContain('# Heading')
  })

  it('re-fetches when the markdown prop changes', async () => {
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({ text: () => Promise.resolve('First') } as unknown as Response)
      .mockResolvedValueOnce({ text: () => Promise.resolve('Second') } as unknown as Response)
    global.fetch = fetchSpy

    let rerender: ReturnType<typeof render>['rerender']
    await act(async () => {
      ;({ rerender } = render(<ScrollableMarkdownContainer markdown="/first.md" />))
    })

    expect(fetchSpy).toHaveBeenCalledWith('/first.md')

    await act(async () => {
      rerender!(<ScrollableMarkdownContainer markdown="/second.md" />)
    })

    expect(fetchSpy).toHaveBeenCalledWith('/second.md')
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  it('renders links with target="_blank" via the a component override', async () => {
    mockFetch('[Link](https://example.com)')

    await act(async () => {
      render(<ScrollableMarkdownContainer markdown="/links.md" />)
    })

    const anchor = screen.getByTestId('markdown-link')
    expect(anchor.getAttribute('target')).toBe('_blank')
  })
})
