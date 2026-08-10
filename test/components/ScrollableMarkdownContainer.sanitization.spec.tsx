import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ScrollableMarkdownContainer from 'src/components/ScrollableMarkdownContainer'

/**
 * These tests deliberately use the REAL react-markdown (no vi.mock) — the point is to
 * pin down the sanitization behaviour we now rely on after removing DOMPurify.
 * If someone later adds `rehype-raw`, a custom `urlTransform`, or `skipHtml={false}`
 * with raw HTML enabled, these tests fail.
 */

const mockFetch = (content: string) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(content),
  } as unknown as Response)
}

// The component caches loaded documents by url, so each case needs its own url — reusing one would
// serve the first case's body to every later case.
let documentCount = 0

const renderMarkdown = async (markdownSource: string): Promise<HTMLElement> => {
  mockFetch(markdownSource)
  documentCount += 1
  let container!: HTMLElement
  await act(async () => {
    ;({ container } = render(<ScrollableMarkdownContainer markdown={`/doc-${documentCount}.md`} />))
  })
  return container
}

describe('ScrollableMarkdownContainer sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('raw HTML in the markdown source is escaped, not executed', () => {
    it('does not create a script element for a raw <script> tag', async () => {
      const container = await renderMarkdown('<script>window.__pwned = true</script>')

      expect(container.querySelector('script')).toBeNull()
      expect(container.textContent).toContain('<script>window.__pwned = true</script>')
      expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined()
    })

    it('does not create an img element for a raw <img onerror> tag', async () => {
      const container = await renderMarkdown('<img src=x onerror="window.__pwned = true">')

      expect(container.querySelector('img')).toBeNull()
      expect(container.textContent).toContain('onerror')
      expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined()
    })

    it('does not create an iframe element for a raw <iframe> tag', async () => {
      const container = await renderMarkdown('<iframe src="https://evil.test"></iframe>')

      expect(container.querySelector('iframe')).toBeNull()
    })

    it('does not create an svg element for a raw <svg onload> tag', async () => {
      const container = await renderMarkdown('<svg onload="window.__pwned = true"></svg>')

      expect(container.querySelector('svg')).toBeNull()
      expect((window as unknown as Record<string, unknown>).__pwned).toBeUndefined()
    })

    it('does not attach inline event handlers to legitimately rendered elements', async () => {
      const container = await renderMarkdown('# Heading <span onmouseover="window.__pwned = true">hi</span>')

      const heading = container.querySelector('h1')
      expect(heading).not.toBeNull()
      expect(heading?.querySelector('span')).toBeNull()
      expect(heading?.getAttribute('onmouseover')).toBeNull()
    })
  })

  describe('dangerous URL schemes are stripped from links', () => {
    it.each([
      ['lowercase javascript:', '[click](javascript:alert(1))'],
      ['mixed-case javascript:', '[click](JaVaScRiPt:alert(1))'],
      ['entity-encoded javascript:', '[click](&#106;avascript:alert(1))'],
      ['vbscript:', '[click](vbscript:msgbox(1))'],
      ['reference-style javascript:', '[click][ref]\n\n[ref]: javascript:alert(1)'],
      ['autolink javascript:', '<javascript:alert(1)>'],
    ])('neutralizes %s in an anchor href', async (_label, source) => {
      const container = await renderMarkdown(source)

      const anchor = container.querySelector('a')
      expect(anchor).not.toBeNull()
      expect(anchor?.getAttribute('href')).toBe('')
      expect(anchor?.getAttribute('href')).not.toMatch(/javascript:|vbscript:/i)
    })
  })

  describe('dangerous URL schemes are stripped from images', () => {
    it.each([
      ['javascript:', '![x](javascript:alert(1))'],
      ['data: html payload', '![x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)'],
    ])('drops the src for %s', async (_label, source) => {
      const container = await renderMarkdown(source)

      const img = container.querySelector('img')
      expect(img).not.toBeNull()
      expect(img?.getAttribute('src')).toBeNull()
    })
  })

  describe('safe content still renders (guards against over-blocking)', () => {
    it('preserves http and https link hrefs', async () => {
      const container = await renderMarkdown('[ok](https://example.com/path?q=1)')

      expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com/path?q=1')
    })

    it('preserves mailto links', async () => {
      const container = await renderMarkdown('[mail](mailto:duos@example.com)')

      expect(container.querySelector('a')?.getAttribute('href')).toBe('mailto:duos@example.com')
    })

    it('preserves relative links', async () => {
      const container = await renderMarkdown('[home](/dataset_catalog)')

      expect(container.querySelector('a')?.getAttribute('href')).toBe('/dataset_catalog')
    })

    it('renders markdown structure rather than the raw source', async () => {
      const container = await renderMarkdown('# Title\n\n- one\n- two\n\n**bold**')

      expect(container.querySelector('h1')?.textContent).toBe('Title')
      expect(container.querySelectorAll('li')).toHaveLength(2)
      expect(container.querySelector('strong')?.textContent).toBe('bold')
    })

    it('opens rendered links in a new tab', async () => {
      const container = await renderMarkdown('[ok](https://example.com)')

      expect(container.querySelector('a')?.getAttribute('target')).toBe('_blank')
    })

    it('pairs the new tab with rel="noopener noreferrer"', async () => {
      // Without rel, the opened page can navigate back through window.opener.
      const container = await renderMarkdown('[ok](https://example.com)')

      expect(container.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer')
    })

    it('escapes a raw anchor rather than rendering one whose target and rel it controls', async () => {
      const container = await renderMarkdown('<a href="https://example.com" target="_self" rel="opener">click</a>')

      expect(container.querySelector('a')).toBeNull()
      expect(container.textContent).toContain('target="_self"')
    })

    it('keeps target and rel on links that carry other attributes', async () => {
      const container = await renderMarkdown('[ok](https://example.com "Title")')
      const anchor = container.querySelector('a')

      expect(anchor?.getAttribute('title')).toBe('Title')
      expect(anchor?.getAttribute('target')).toBe('_blank')
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })
})
