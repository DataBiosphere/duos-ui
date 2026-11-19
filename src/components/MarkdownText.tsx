import React, { useMemo } from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import { Box } from '@mui/material'
import MarkdownLink from 'src/components/MarkdownLink'
import { normalizeMarkdown } from 'src/utils/normalizeMarkdown'

interface MarkdownTextProps {
  /** Text that people or an integration wrote, which can contain Markdown. */
  text: string | null | undefined
}

const ABSOLUTE_WEB_URL = /^https?:\/\//i
const EMAIL_URL = /^mailto:/i

// A relative URL in a description is relative to the site the text came from (dbGaP's
// `GetPdf.cgi?id=…`, for one), so here it would point at a DUOS page that does not exist. The
// link text is still worth showing. An email link stays a link, or its address would be lost,
// and it does not need a new tab.
const DescriptionLink = ({ href, title, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
  if (href && ABSOLUTE_WEB_URL.test(href)) {
    return <MarkdownLink href={href} title={title}>{children}</MarkdownLink>
  }
  if (href && EMAIL_URL.test(href)) {
    return <a href={href} title={title}>{children}</a>
  }
  return <>{children}</>
}

// The page owns the heading order, so a heading in a description is only emphasis.
const DescriptionHeading = ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <p><strong>{children}</strong></p>
)

// The Content Security Policy only lets images load from DUOS itself, and a description has no
// business making every reader's browser call a third party. The alternative text stands in for
// the image, so the reader can see that something was there.
const DescriptionImage = ({ alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (alt ? <>{alt}</> : null)

const components: Components = {
  a: DescriptionLink,
  img: DescriptionImage,
  h1: DescriptionHeading,
  h2: DescriptionHeading,
  h3: DescriptionHeading,
  h4: DescriptionHeading,
  h5: DescriptionHeading,
  h6: DescriptionHeading,
}

const textStyle = {
  'overflowWrap': 'anywhere',
  '& p, & ul, & ol': { mt: 0, mb: 1.5 },
  '& ul, & ol': { pl: 3 },
  '& > :last-child': { mb: 0 },
}

/**
 * Shows a description as formatted text rather than as raw Markdown.
 *
 * Raw HTML in the text is shown as text: do not add `rehype-raw` here.
 */
export default function MarkdownText({ text }: Readonly<MarkdownTextProps>) {
  const markdown = useMemo(() => (text ? normalizeMarkdown(text) : ''), [text])
  if (markdown === '') return null
  return (
    <Box sx={textStyle}>
      <ReactMarkdown components={components}>
        {markdown}
      </ReactMarkdown>
    </Box>
  )
}
