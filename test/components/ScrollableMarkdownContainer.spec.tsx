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
    ok: true,
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

  it('reuses the loaded markdown when the same document is reopened', async () => {
    mockFetch('Cached content')

    const first = render(<ScrollableMarkdownContainer markdown="/cached.md" />)
    await act(async () => undefined)
    first.unmount()

    render(<ScrollableMarkdownContainer markdown="/cached.md" />)
    await act(async () => undefined)

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('reports its load state so callers can gate on the document being visible', async () => {
    mockFetch('Agreement body')
    const onLoadStateChange = vi.fn()

    render(<ScrollableMarkdownContainer markdown="/state.md" onLoadStateChange={onLoadStateChange} />)
    expect(onLoadStateChange).toHaveBeenCalledWith('loading')

    await act(async () => undefined)
    expect(onLoadStateChange).toHaveBeenLastCalledWith('loaded')
  })

  it('reports an error state and explains the gap when the document cannot be loaded', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 } as unknown as Response)
    const onLoadStateChange = vi.fn()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(<ScrollableMarkdownContainer markdown="/missing.md" onLoadStateChange={onLoadStateChange} />)
    await act(async () => undefined)

    expect(onLoadStateChange).toHaveBeenLastCalledWith('error')
    expect(screen.getByRole('alert').textContent).toContain('could not be loaded')
    consoleError.mockRestore()
  })

  it('retries a failed document rather than caching the failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 } as unknown as Response)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const failed = render(<ScrollableMarkdownContainer markdown="/flaky.md" />)
    await act(async () => undefined)
    failed.unmount()

    mockFetch('Recovered content')
    render(<ScrollableMarkdownContainer markdown="/flaky.md" />)
    await act(async () => undefined)

    expect(screen.getByTestId('markdown-link').textContent).toContain('Recovered content')
    consoleError.mockRestore()
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
