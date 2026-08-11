import ReactMarkdown from 'react-markdown'
import React, { useEffect, useState } from 'react'
import { Theme } from 'src/libs/theme'

export type MarkdownLoadState = 'loading' | 'loaded' | 'error'

interface MarkdownResult {
  markdown: string
  text: string
  state: Exclude<MarkdownLoadState, 'loading'>
}

interface ScrollableMarkdownContainerProps {
  markdown: string
  /** Lets callers gate an action on the document being visible — see the DPA attestation flow. */
  onLoadStateChange?: (state: MarkdownLoadState) => void
}

// target and rel come after the spread so document content cannot override them: without rel the
// opened page can reach back through window.opener.
const MarkdownLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer" />
)

const markdownComponents = { a: MarkdownLink }

const markdownCache = new Map<string, Promise<string>>()

const loadMarkdown = (markdown: string): Promise<string> => {
  const cachedMarkdown = markdownCache.get(markdown)
  if (cachedMarkdown) {
    return cachedMarkdown
  }

  const markdownRequest = fetch(markdown)
    .then((res) => {
      // Without this an error page would be cached as the document body for the rest of the session.
      if (!res.ok) {
        throw new Error(`Failed to load ${markdown}: ${res.status}`)
      }
      return res.text()
    })
    .catch((error: unknown) => {
      markdownCache.delete(markdown)
      throw error
    })
  markdownCache.set(markdown, markdownRequest)
  return markdownRequest
}

const containerStyle: React.CSSProperties = {
  maxWidth: '700px',
  minWidth: '700px',
  maxHeight: '200px',
  overflow: 'auto',
  marginBottom: '25px',
}

const errorStyle: React.CSSProperties = { color: Theme.palette.error }

export default function ScrollableMarkdownContainer({ markdown, onLoadStateChange }: Readonly<ScrollableMarkdownContainerProps>) {
  // The result carries the document it belongs to, so a result for a previous `markdown` is ignored
  // rather than reset. A new document therefore cannot show the previous one's body, and callers
  // cannot be told 'loaded' while a different document is still in flight.
  const [result, setResult] = useState<MarkdownResult | null>(null)
  const currentResult = result?.markdown === markdown ? result : null
  const loadState: MarkdownLoadState = currentResult?.state ?? 'loading'
  const text = currentResult?.text ?? ''

  useEffect(() => {
    let isMounted = true
    const init = async (): Promise<void> => {
      try {
        const md = await loadMarkdown(markdown)
        if (isMounted) {
          setResult({ markdown, text: md, state: 'loaded' })
        }
      }
      catch (error) {
        // Surfaced rather than swallowed silently: callers render this inside consent flows.
        console.error(`Unable to load markdown document ${markdown}:`, error)
        if (isMounted) {
          setResult({ markdown, text: '', state: 'error' })
        }
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [markdown])

  useEffect(() => {
    onLoadStateChange?.(loadState)
  }, [loadState, onLoadStateChange])

  return (
    <div style={containerStyle}>
      {loadState === 'error'
        ? <div style={errorStyle} role="alert">This document could not be loaded. Please close this dialog and try again.</div>
        : <ReactMarkdown components={markdownComponents}>{text}</ReactMarkdown>}
    </div>
  )
}
