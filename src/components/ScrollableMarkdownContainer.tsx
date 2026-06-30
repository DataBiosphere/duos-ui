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

export default function ScrollableMarkdownContainer({ markdown }: Readonly<ScrollableMarkdownContainerProps>) {
  const [text, setText] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      const res = await fetch(markdown)
      const md = await res.text()
      setText(md)
    }
    init()
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
