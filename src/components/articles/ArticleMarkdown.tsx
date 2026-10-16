import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box } from '@mui/material'
import { Link } from 'react-router'
import { Theme } from 'src/libs/theme'

interface ArticleMarkdownProps {
  readonly markdown: string
}

/** An app route, as opposed to an external URL or a file such as /article-images/chart.png. */
const isAppRoute = (href: string): boolean =>
  href.startsWith('/') && !href.startsWith('//') && !/\.\w+$/.test(href.split(/[?#]/)[0])

/** In-page anchors (including GFM footnotes), files on this site, mail and phone links. */
const isSameTabLink = (href: string): boolean => /^(#|\/(?!\/)|mailto:|tel:)/.test(href)

// target and rel come after the spread so content cannot override them: without rel the opened
// page can reach back through window.opener.
const ArticleLink = ({ href = '', children, node: _node, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) => {
  if (isAppRoute(href)) {
    return <Link to={href}>{children}</Link>
  }
  if (isSameTabLink(href)) {
    return <a {...props} href={href}>{children}</a>
  }
  return <a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</a>
}

// react-markdown always passes alt, empty for an image written without one.
const ArticleImage = ({ node: _node, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) =>
  <img {...props} loading="lazy" />

const markdownComponents = { a: ArticleLink, img: ArticleImage }

const remarkPlugins = [remarkGfm]

const ARTICLE_CONTENT_SX = {
  'fontSize': '1.6rem',
  'lineHeight': 1.7,
  'color': Theme.palette.primary,
  'overflowWrap': 'anywhere',
  '& h1, & h2, & h3, & h4': { fontWeight: 600, lineHeight: 1.3, marginTop: '1.5em', marginBottom: '0.5em' },
  '& h1': { fontSize: '2.8rem' },
  '& h2': { fontSize: '2.4rem' },
  '& h3': { fontSize: '2rem' },
  '& h4': { fontSize: '1.8rem' },
  '& p, & ul, & ol, & blockquote, & pre, & table': { marginBottom: '1em' },
  '& img': { maxWidth: '100%', height: 'auto', borderRadius: '4px' },
  '& blockquote': { borderLeft: `4px solid ${Theme.palette.link}`, margin: 0, paddingLeft: '1.6rem', color: '#555' },
  '& code': { fontFamily: 'monospace', backgroundColor: '#f2f4f7', padding: '0.1em 0.3em', borderRadius: '3px', fontSize: '0.9em' },
  '& pre': { backgroundColor: '#f2f4f7', padding: '1.2rem', borderRadius: '4px', overflowX: 'auto' },
  '& pre code': { backgroundColor: 'transparent', padding: 0 },
  '& table': { borderCollapse: 'collapse', display: 'block', overflowX: 'auto' },
  '& th, & td': { border: '1px solid #d0d5dd', padding: '0.6rem 1rem', textAlign: 'left' },
  '& th': { backgroundColor: '#f2f4f7', fontWeight: 600 },
  '& hr': { border: 0, borderTop: '1px solid #d0d5dd', margin: '2em 0' },
  '& a': { color: Theme.palette.link },
  '& > :first-child': { marginTop: 0 },
}

/** Renders an article body. Raw HTML is never rendered, and unsafe URLs such as javascript: are dropped. */
export const ArticleMarkdown = ({ markdown }: ArticleMarkdownProps) => (
  <Box sx={ARTICLE_CONTENT_SX}>
    <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
      {markdown}
    </ReactMarkdown>
  </Box>
)
