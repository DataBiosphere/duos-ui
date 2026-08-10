import ReactMarkdown from 'react-markdown'
import DOMPurify from 'dompurify'
import React, { useEffect, useState } from 'react'
import { isEmpty } from 'src/utils/NodashUtil'

interface ScrollableMarkdownContainerProps {
  markdown: string
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

export default function ScrollableMarkdownContainer({ markdown }: Readonly<ScrollableMarkdownContainerProps>) {
  const [text, setText] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    const init = async (): Promise<void> => {
      try {
        const md = await loadMarkdown(markdown)
        if (isMounted) {
          setText(md)
        }
      }
      catch (error) {
        // Surfaced rather than swallowed silently: callers render this inside consent flows.
        console.error(`Unable to load markdown document ${markdown}:`, error)
      }
    }
    void init()
    return () => {
      isMounted = false
    }
  }, [markdown])

  const generateContent = (markdownText: string): React.ReactElement => (
    <ReactMarkdown components={markdownComponents}>
      {DOMPurify.sanitize(markdownText)}
    </ReactMarkdown>
  )

  const content = generateContent(text)

  return (
    <div
      style={{
        maxWidth: '700px',
        minWidth: '700px',
        maxHeight: '200px',
        overflow: 'auto',
        marginBottom: '25px',
      }}
    >
      {!isEmpty(content) && content}
    </div>
  )
}
