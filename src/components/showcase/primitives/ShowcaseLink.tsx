import React from 'react'
import { Link as RouterLink } from 'react-router'
import { isSafeHref } from 'src/components/showcase/primitives/safeHref'
import './ShowcaseLink.css'

type ShowcaseLinkProps = {
  'href': string
  'children': React.ReactNode
  'aria-describedby'?: string
}

/**
 * A link that applies the showcase URL policy again before it renders, and renders nothing for an
 * href that fails it. Same-origin paths use the router; https and same-page links are plain links
 * that open in the same tab.
 */
export const ShowcaseLink = ({ href, children, ...rest }: ShowcaseLinkProps) => {
  if (!isSafeHref(href)) {
    return null
  }
  return href.startsWith('/')
    ? <RouterLink className="showcase-link" to={href} {...rest}>{children}</RouterLink>
    : <a className="showcase-link" href={href} {...rest}>{children}</a>
}
