/**
 * The resource card that Analysis Apps (`featured-tools`) and Workspaces (`featured-workspaces`)
 * render (DT-4356, S3.4). The fields are the Story 29 item form: name, description, tags, an
 * optional thumbnail, a launch URL and an optional docs URL. The artifact's publisher, difficulty,
 * duration, related-item and clone or usage fields are left out (contracts record).
 *
 * Each action is a named link that the card heading describes, so a screen reader hears
 * "Launch, <name>". "Launch" opens the resource itself: the card holds no Terra credentials and
 * starts nothing. The card drops a same-page `#section` launch link, so "Launch" never just
 * scrolls the page; DT-4356 adds a CI guard rule that rejects one as well. "Documentation" may be
 * a same-page link, which shows only while its section is visible.
 *
 * The media box is always reserved, so cards without a thumbnail keep the same layout. A thumbnail
 * that names no bundled image shows its alt text in the box, as `images.ts` describes.
 */
import React from 'react'
import { Card, type HeadingLevel } from 'src/components/showcase/primitives/Card'
import type { ShowcaseAction } from 'src/components/showcase/primitives/safeHref'
import type { EnabledSection } from 'src/components/showcase/sectionRegistry'
import { imageLoading } from 'src/showcases/imageLoading'
import { resolveShowcaseImage } from 'src/showcases/images'
import type { SectionKey } from 'src/types/showcase'

/** Provisional copy (S3.4). */
export const LAUNCH_LABEL = 'Launch'
export const DOCUMENTATION_LABEL = 'Documentation'

/** The Story 29 fields every resource section shares; `featured-tools` adds `featured`. */
export type ResourceItem = EnabledSection<'featured-workspaces'>['items'][number]

const resourceActions = ({ launchUrl, docsUrl }: ResourceItem): ShowcaseAction[] => [
  ...(launchUrl.startsWith('#') ? [] : [{ label: LAUNCH_LABEL, href: launchUrl }]),
  ...(docsUrl === undefined ? [] : [{ label: DOCUMENTATION_LABEL, href: docsUrl }]),
]

export interface ResourceCardProps {
  item: ResourceItem
  /** The section the card renders in, which decides how its thumbnail loads. */
  sectionKey: SectionKey
  headingLevel?: HeadingLevel
  featured?: boolean
}

export const ResourceCard = ({ item, sectionKey, headingLevel = 3, featured = false }: ResourceCardProps) => {
  const { thumbnail } = item
  const src = thumbnail === undefined ? undefined : resolveShowcaseImage(thumbnail.src)
  return (
    <Card
      title={item.name}
      headingLevel={headingLevel}
      variant={featured ? 'featured' : 'default'}
      reserveMedia
      // An unresolved thumbnail keeps its alt text; Card shows it when the empty `src` fails its check.
      media={thumbnail === undefined ? undefined : { src: src ?? '', alt: thumbnail.alt, loading: imageLoading(sectionKey) }}
      badges={item.tags}
      actions={resourceActions(item)}
    >
      <p className="showcase-card__description">{item.description}</p>
    </Card>
  )
}
