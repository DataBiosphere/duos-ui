/**
 * The Analysis Apps section, `featured-tools` (DT-4356, S3.4): one full-width featured app above a
 * grid of the others (original Story 14; the artifact's app grid). The CI guard allows at most one
 * `featured: true` item (DT-4356). That item takes the featured slot wherever the config lists it, so it is
 * first on the page and first in keyboard order; the other apps follow in config order. With no
 * featured item, every app is in the grid.
 *
 * The section's DOM id is on the root element, the target of `#featured-tools` links.
 */
import React, { useId } from 'react'
import Box from '@mui/material/Box'
import { Grid } from 'src/components/showcase/primitives/Grid'
import { ResourceCard } from 'src/components/showcase/primitives/ResourceCard'
import type { SectionRendererProps } from 'src/components/showcase/sectionRegistry'

/** Provisional (D15): the section frame the dataset shelves use. */
const rootSx = { maxWidth: '1400px', mx: 'auto', px: '16px', py: '32px' }

export const AnalysisApps = ({ sectionKey, section, id, title = '' }: SectionRendererProps<'featured-tools'>) => {
  const headingId = useId()
  const featured = section.items.find(item => item.featured === true)
  const others = section.items.filter(item => item !== featured)

  return (
    <Box id={id} sx={rootSx}>
      <section className="showcase-shelf" aria-labelledby={headingId}>
        <div className="showcase-shelf__header">
          <h2 id={headingId} className="showcase-shelf__title">{title}</h2>
        </div>
        <Grid featured={featured && <ResourceCard item={featured} sectionKey={sectionKey} featured />}>
          {others.map(item => <ResourceCard key={item.id} item={item} sectionKey={sectionKey} />)}
        </Grid>
      </section>
    </Box>
  )
}
