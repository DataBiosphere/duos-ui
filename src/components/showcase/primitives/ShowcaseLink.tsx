import React, { useContext } from 'react'
import { Link as RouterLink } from 'react-router'
import { isPublicPath, ShowcaseHandoffsContext } from 'src/components/showcase/handoffs'
import { isShownHref } from 'src/components/showcase/primitives/safeHref'
import { ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'
import './ShowcaseLink.css'

type ShowcaseLinkProps = {
  'href': string
  'children': React.ReactNode
  'aria-describedby'?: string
}

/** Shown after a handoff link when the visitor is not signed in (S3.2). Provisional copy. */
export const SIGN_IN_REQUIRED_TEXT = 'Sign-in required'
/** Read after a handoff that a production-data preview turns off (S3.2). Provisional copy. */
export const UNAVAILABLE_IN_PREVIEW_TEXT = 'not available in this preview'

/**
 * A link that applies the showcase URL policy again before it renders, and renders nothing for an
 * href that fails it, or for a same-page link whose target section is not visible (S3.3). Same-origin paths use the router; https and same-page links are plain links
 * that open in the same tab.
 *
 * An internal path to a signed-in page is a handoff (`handoffs.ts`). It says "Sign-in required"
 * to a visitor who is not signed in, and in a production-data preview it is plain text, not a
 * link, so a production identifier never opens a record in this environment.
 */
export const ShowcaseLink = ({ href, children, ...rest }: ShowcaseLinkProps) => {
  const handoffs = useContext(ShowcaseHandoffsContext)
  const { visibleSectionIds } = useContext(ShowcasePageInfoContext)
  if (!isShownHref(href, visibleSectionIds)) {
    return null
  }
  if (!href.startsWith('/')) {
    return <a className="showcase-link" href={href} {...rest}>{children}</a>
  }
  if (isPublicPath(href)) {
    return <RouterLink className="showcase-link" to={href} {...rest}>{children}</RouterLink>
  }
  if (!handoffs.enabled) {
    return (
      <span className="showcase-link showcase-link--unavailable">
        {children}
        {' '}
        <span className="showcase-visually-hidden">{`(${UNAVAILABLE_IN_PREVIEW_TEXT})`}</span>
      </span>
    )
  }
  return (
    <RouterLink className="showcase-link" to={href} {...rest}>
      {children}
      {!handoffs.signedIn && (
        <>
          {' '}
          <span className="showcase-link__note">{`(${SIGN_IN_REQUIRED_TEXT})`}</span>
        </>
      )}
    </RouterLink>
  )
}
