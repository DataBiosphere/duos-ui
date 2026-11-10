import React, { Children, useContext, useId } from 'react'
import Box from '@mui/material/Box'
import type { HeadingLevel } from 'src/components/showcase/primitives/Card'
import { isShownHref, ShowcaseAction } from 'src/components/showcase/primitives/safeHref'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'
// The panel shares the card's provisional frame, title and link-row styles.
import { panelSx } from 'src/components/showcase/primitives/cardStyles'

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
    <Box component="section" sx={panelSx.panel} aria-labelledby={headingId}>
      <Box component={Heading} id={headingId} sx={panelSx.title}>{title}</Box>
      {Children.toArray(children).length > 0 && <div>{children}</div>}
      {links.length > 0 && (
        <Box component="ul" sx={panelSx.actions}>
          {links.map((action, i) => (
            <li key={`${i} ${action.label}`}>
              <ShowcaseLink href={action.href}>{action.label}</ShowcaseLink>
            </li>
          ))}
        </Box>
      )}
    </Box>
  )
}
