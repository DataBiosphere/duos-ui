import ReactMarkdown from 'react-markdown'
import React, { useEffect, useState } from 'react'
import { isEmpty } from 'src/utils/NodashUtil'
import { Theme } from 'src/libs/theme'

export type MarkdownLoadState = 'loading' | 'loaded' | 'error'

interface ScrollableMarkdownContainerProps {
  markdown: string
  /** Lets callers gate an action on the document being visible — see the DPA attestation flow. */
  onLoadStateChange?: (state: MarkdownLoadState) => void
}

const MarkdownLink = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a target="_blank" {...props} />
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
  const [text, setText] = useState<string>('')
  const [loadState, setLoadState] = useState<MarkdownLoadState>('loading')
  const [requestedMarkdown, setRequestedMarkdown] = useState<string>(markdown)

  // Cleared as the prop changes, so a new document never shows the previous one's body and callers
  // are never told 'loaded' while a different document is still in flight.
  if (markdown !== requestedMarkdown) {
    setRequestedMarkdown(markdown)
    setText('')
    setLoadState('loading')
  }

  useEffect(() => {
    let isMounted = true
    const init = async (): Promise<void> => {
      try {
        const md = await loadMarkdown(markdown)
        if (isMounted) {
          setText(md)
          setLoadState('loaded')
        }
      }
      catch (error) {
        // Surfaced rather than swallowed silently: callers render this inside consent flows.
        console.error(`Unable to load markdown document ${markdown}:`, error)
        if (isMounted) {
          setLoadState('error')
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

  const generateContent = (markdownText: string): React.ReactElement => (
    <ReactMarkdown components={markdownComponents}>
      {markdownText}
    </ReactMarkdown>
  )

  const content = generateContent(text)

  return (
    <div style={containerStyle}>
      {loadState === 'error'
        ? <div style={errorStyle} role="alert">This document could not be loaded. Please close this dialog and try again.</div>
        : !isEmpty(content) && content}
    </div>
  )
}
