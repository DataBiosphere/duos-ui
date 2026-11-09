import React, { Children, useContext, useId, useState } from 'react'
import Box from '@mui/material/Box'
import { cardSx } from 'src/components/showcase/primitives/cardStyles'
import { isSafeImageSrc, isShownHref, ShowcaseAction } from 'src/components/showcase/primitives/safeHref'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import { ShowcasePageInfoContext } from 'src/components/showcase/showcaseTemplateContract'

export type HeadingLevel = 2 | 3 | 4 | 5 | 6

/** One labeled field. An entry whose value is missing or blank is left out of the card. */
export type CardMetadataEntry = { label: string, value: string | null | undefined, href?: string }

export type CardMedia = {
  src: string
  /** Empty for a decorative image. */
  alt: string
  /** From `imageLoading(section)`: the card doesn't know which section it renders in. */
  loading?: 'eager' | 'lazy'
}

export type CardProps = {
  title: string
  /** One `h1` per page and an `h2` per section, so cards default to `h3`. */
  headingLevel?: HeadingLevel
  media?: CardMedia
  children?: React.ReactNode
  metadata?: readonly CardMetadataEntry[]
  badges?: readonly string[]
  actions?: readonly ShowcaseAction[]
  variant?: 'default' | 'featured'
  /** Keep a fixed-ratio media box even when there is no image, so cards in a row line up. Media
   * whose source can't be shown, or that fails to load, leaves its alt text in the box. With no
   * media, or no alt text, the box is decorative and hidden from assistive technology. */
  reserveMedia?: boolean
}

const hasValue = (entry: CardMetadataEntry): entry is CardMetadataEntry & { value: string } =>
  typeof entry.value === 'string' && entry.value.trim() !== ''

/**
 * The image, or its alt text once it fails to load, as the masthead logos do. The caller keys it by
 * `src`, so a new source gets a fresh attempt.
 */
const CardImage = ({ media, framed, sx }: { media: CardMedia, framed: boolean, sx: ReturnType<typeof cardSx> }) => {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return media.alt.trim() === '' ? null : <Box component="span" sx={framed ? sx.mediaAlt : sx.imageAlt}>{media.alt}</Box>
  }
  return (
    <Box
      component="img"
      src={media.src}
      alt={media.alt}
      loading={media.loading ?? 'lazy'}
      onError={() => setFailed(true)}
      sx={framed ? sx.framedImage : sx.image}
    />
  )
}

/**
 * The base showcase card. The title is a real heading, and each action is its own named link that
 * the title describes; the card itself is not a click target, so links in the body still work.
 *
 * The `showcase-card__*` class names carry no styles; they are stable hooks for tests.
 */
export const Card = ({ title, headingLevel = 3, media, children, metadata = [], badges = [], actions = [], variant = 'default', reserveMedia = false }: CardProps) => {
  const headingId = useId()
  const Heading = `h${headingLevel}` as const
  const entries = metadata.filter(hasValue)
  // ShowcaseLink renders nothing for a hidden same-page link, so leave those out of the list too.
  const { visibleSectionIds } = useContext(ShowcasePageInfoContext)
  const links = actions.filter(action => isShownHref(action.href, visibleSectionIds))
  const showMedia = media !== undefined && isSafeImageSrc(media.src)
  const mediaAlt = media?.alt.trim() ?? ''
  const sx = cardSx(variant === 'featured')
  const image = showMedia && <CardImage key={media.src} media={media} framed={reserveMedia} sx={sx} />

  return (
    <Box component="article" className="showcase-card" sx={sx.card} aria-labelledby={headingId} data-variant={variant}>
      {reserveMedia
        ? (
            <Box className="showcase-card__media-frame" sx={sx.mediaFrame} aria-hidden={mediaAlt === '' ? true : undefined}>
              {image || (mediaAlt !== '' && <Box component="span" sx={sx.mediaAlt}>{mediaAlt}</Box>)}
            </Box>
          )
        : image}
      <Box className="showcase-card__body" sx={sx.body}>
        <Box component={Heading} id={headingId} sx={sx.title}>{title}</Box>
        {badges.length > 0 && (
          <Box component="ul" className="showcase-card__badges" sx={sx.badges}>
            {badges.map((badge, i) => <Box component="li" sx={sx.badge} key={`${i} ${badge}`}>{badge}</Box>)}
          </Box>
        )}
        {Children.toArray(children).length > 0 && <div>{children}</div>}
        {entries.length > 0 && (
          <Box component="dl" sx={sx.metadata}>
            {entries.map((entry, i) => (
              <React.Fragment key={`${i} ${entry.label}`}>
                <Box component="dt" sx={sx.term}>{entry.label}</Box>
                <Box component="dd" sx={sx.value}>
                  {entry.href !== undefined && isShownHref(entry.href, visibleSectionIds)
                    ? <ShowcaseLink href={entry.href}>{entry.value}</ShowcaseLink>
                    : entry.value}
                </Box>
              </React.Fragment>
            ))}
          </Box>
        )}
        {links.length > 0 && (
          <Box component="ul" sx={sx.actions}>
            {links.map((action, i) => (
              <li key={`${i} ${action.label}`}>
                <ShowcaseLink href={action.href} aria-describedby={headingId}>{action.label}</ShowcaseLink>
              </li>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
