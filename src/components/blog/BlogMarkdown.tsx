import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box } from '@mui/material'
import { Link } from 'react-router'
import { Theme } from 'src/libs/theme'
import { useBlogImageResolver } from 'src/components/blog/useBlogImageResolver'
import { blogUrlTransform } from 'src/components/blog/blogUrlTransform'

interface BlogMarkdownProps {
  readonly markdown: string
}

const isInternalPath = (href: string | undefined): href is string =>
  href !== undefined && href.startsWith('/') && !href.startsWith('//')

// Internal links stay in the app; anything else opens in a new tab. target and rel come after the
// spread so content cannot override them: without rel the opened page can reach back through
// window.opener.
const BlogLink = ({ href, children, node: _node, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { node?: unknown }) =>
  isInternalPath(href)
    ? <Link to={href}>{children}</Link>
    : <a {...props} href={href} target="_blank" rel="noopener noreferrer">{children}</a>

const BlogImage = ({ node: _node, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }) =>
  <img {...props} alt={alt ?? ''} loading="lazy" />

const markdownComponents = { a: BlogLink, img: BlogImage }

const remarkPlugins = [remarkGfm]

const BLOG_CONTENT_SX = {
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

/**
 * The one renderer for blog content, shared by the editor preview and the public pages so the
 * preview is exactly what readers see. Raw HTML is never rendered.
 */
export const BlogMarkdown = ({ markdown }: BlogMarkdownProps) => {
  const resolveImage = useBlogImageResolver()
  return (
    <Box sx={BLOG_CONTENT_SX} className="blog-markdown">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={markdownComponents}
        urlTransform={blogUrlTransform(resolveImage)}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
  )
}

export default BlogMarkdown
