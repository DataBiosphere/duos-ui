import React, { useId } from 'react'
import { isSafeHref, isSafeImageSrc, ShowcaseAction } from 'src/components/showcase/primitives/safeHref'
import { ShowcaseLink } from 'src/components/showcase/primitives/ShowcaseLink'
import './Card.css'

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
}

const hasValue = (entry: CardMetadataEntry): entry is CardMetadataEntry & { value: string } =>
  typeof entry.value === 'string' && entry.value.trim() !== ''

/**
 * The base showcase card. The title is a real heading, and each action is its own named link that
 * the title describes; the card itself is not a click target, so links in the body still work.
 */
export const Card = ({ title, headingLevel = 3, media, children, metadata = [], badges = [], actions = [], variant = 'default' }: CardProps) => {
  const headingId = useId()
  const Heading = `h${headingLevel}` as const
  const entries = metadata.filter(hasValue)
  const links = actions.filter(action => isSafeHref(action.href))
  const showMedia = media !== undefined && isSafeImageSrc(media.src)

  return (
    <article
      className={variant === 'featured' ? 'showcase-card showcase-card--featured' : 'showcase-card'}
      aria-labelledby={headingId}
      data-variant={variant}
    >
      {showMedia && <img className="showcase-card__media" src={media.src} alt={media.alt} loading={media.loading ?? 'lazy'} />}
      <div className="showcase-card__body">
        <Heading className="showcase-card__title" id={headingId}>{title}</Heading>
        {badges.length > 0 && (
          <ul className="showcase-card__badges">
            {badges.map(badge => <li className="showcase-card__badge" key={badge}>{badge}</li>)}
          </ul>
        )}
        {children !== undefined && <div>{children}</div>}
        {entries.length > 0 && (
          <dl className="showcase-card__metadata">
            {entries.map(entry => (
              <React.Fragment key={entry.label}>
                <dt className="showcase-card__term">{entry.label}</dt>
                <dd className="showcase-card__value">
                  {entry.href !== undefined && isSafeHref(entry.href)
                    ? <ShowcaseLink href={entry.href}>{entry.value}</ShowcaseLink>
                    : entry.value}
                </dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {links.length > 0 && (
          <ul className="showcase-card__actions">
            {links.map(action => (
              <li key={`${action.label} ${action.href}`}>
                <ShowcaseLink href={action.href} aria-describedby={headingId}>{action.label}</ShowcaseLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
