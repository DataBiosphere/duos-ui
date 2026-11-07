import React, { Children, useContext, useId } from 'react'
import type { HeadingLevel } from 'src/components/showcase/primitives/Card'
import { isShownHref, ShowcaseAction } from 'src/components/showcase/primitives/safeHref'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'
// The panel shares the card's stylesheet and its provisional values.
import './Card.css'

export type StructuredPanelProps = {
  title: string
  /** A panel usually sits under the page's `h1`, so it defaults to `h2`. */
  headingLevel?: HeadingLevel
  children?: React.ReactNode
  actions?: readonly ShowcaseAction[]
}

/** A titled panel for content that isn't a shelf of cards, such as the hero's announcements. */
export const StructuredPanel = ({ title, headingLevel = 2, children, actions = [] }: StructuredPanelProps) => {
  const headingId = useId()
  const Heading = `h${headingLevel}` as const
  // ShowcaseLink renders nothing for a hidden same-page link, so leave those out of the list too.
  const { visibleSectionIds } = useContext(ShowcasePageInfoContext)
  const links = actions.filter(action => isShownHref(action.href, visibleSectionIds))
  return (
    <section className="showcase-panel" aria-labelledby={headingId}>
      <Heading className="showcase-panel__title" id={headingId}>{title}</Heading>
      {Children.toArray(children).length > 0 && <div>{children}</div>}
      {links.length > 0 && (
        <ul className="showcase-panel__actions">
          {links.map((action, i) => (
            <li key={`${i} ${action.label}`}>
              <ShowcaseLink href={action.href}>{action.label}</ShowcaseLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
