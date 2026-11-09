/**
 * The Workspaces section, `featured-workspaces` (DT-4356, S3.4): starter workspaces in their own
 * shelf, apart from the Analysis Apps grid (the artifact's workspace shelf). Each workspace is a
 * `ResourceCard` in config order, in the `Shelf` primitive, which adds the named scroll controls
 * when the cards overflow (D1 to D3). "Launch" opens the workspace where it is hosted; DUOS doesn't
 * clone it or start anything.
 *
 * The section's DOM id is on the root element, the target of `#featured-workspaces` links, such as
 * the hero's onboarding link (original Story 18).
 */
import React, { useId } from 'react'
import Box from '@mui/material/Box'
import { ResourceCard } from 'src/components/showcase/primitives/ResourceCard'
import { Shelf } from 'src/components/showcase/primitives/Shelf'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'

/** Provisional (D15): the section frame the dataset shelves use. */
const rootSx = { maxWidth: '1400px', mx: 'auto', px: '16px', py: '32px' }

export const WorkspaceShelf = ({ sectionKey, section, id, title = '' }: SectionRendererProps<'featured-workspaces'>) => {
  const headingId = useId()
  return (
    <Box id={id} sx={rootSx}>
      <Shelf title={title} headingId={headingId}>
        {section.items.map(item => <ResourceCard key={item.id} item={item} sectionKey={sectionKey} />)}
      </Shelf>
    </Box>
  )
}
