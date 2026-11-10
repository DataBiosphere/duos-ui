/**
 * MUI `sx` styles for Card, FeaturedCard and StructuredPanel (DT-4353, S3.1; DT-4356, S3.4), kept
 * out of the component files so fast refresh works. Colors are the showcase template's custom
 * properties; each fallback is the template's value, so the primitives still render outside it.
 * Light theme only.
 */
import type { SxProps, Theme } from '@mui/material/styles'

/** Provisional (design review D18): the featured card stacks at 640px and below. */
const STACKED = '@media (max-width: 640px)'

/** Provisional (design review D18): the card and panel frame, from the artifact's .card.
 * Provisional (design review D16): the neutrals, from the artifact's light theme. */
const frame: SxProps<Theme> = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  boxSizing: 'border-box',
  padding: '1.35rem 1.4rem 1.45rem',
  borderRadius: '3px',
  background: 'var(--showcase-surface, #ffffff)',
  border: '1px solid var(--showcase-border, rgba(33, 43, 54, 0.12))',
}

const title: SxProps<Theme> = { m: 0, color: 'var(--showcase-primary, #1f3b50)', overflowWrap: 'anywhere' }

/** Lists without bullets, laid out in a wrapping row. */
const row: SxProps<Theme> = { display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', m: 0, p: 0, listStyle: 'none' }

/** The image fills the reserved box, cropped to its 16:9 ratio. */
const framedImage: SxProps<Theme> = { display: 'block', width: '100%', height: '100%', objectFit: 'cover' }

/** Alt text shown in place of an image: an outer box for the padding and an inner one clamped to four
 * lines with an ellipsis. The clamp sits inside the padding, so no part of a fifth line shows in
 * it. Screen readers still read all of the text. */
const altText: SxProps<Theme> = { display: 'block', p: '0.75rem', color: 'var(--showcase-primary, #1f3b50)' }
const altTextLines: SxProps<Theme> = {
  overflowWrap: 'anywhere',
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 4,
  overflow: 'hidden',
}

const buildCardSx = (featured: boolean) => ({
  card: {
    ...frame,
    height: '100%',
    // Provisional (design review D18): the featured card, from the artifact's featured app card
    // (.research-card.tool-hero): media beside the text.
    ...(featured && {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: '1.8rem',
      padding: '1.7rem 1.8rem 1.9rem',
      borderRadius: '4px',
      background: 'var(--showcase-accent-tint, #ecedf8)',
      borderColor: 'var(--showcase-border-strong, rgba(33, 43, 54, 0.24))',
      [STACKED]: { flexDirection: 'column' },
    }),
  },
  image: { display: 'block', maxWidth: featured ? '50%' : '100%', height: 'auto', flexShrink: 0, [STACKED]: { maxWidth: '100%' } },
  // Without a reserved box, the alt text of a failed image takes the image's width cap, so long
  // text can't squeeze the featured card's body.
  imageAlt: { ...altText, boxSizing: 'border-box', flex: featured ? '0 0 50%' : undefined, [STACKED]: { flexBasis: 'auto' } },
  // Provisional (design review D18): the reserved media box of a resource card (S3.4), so a card
  // without an image keeps the same height as one with an image.
  mediaFrame: {
    flexShrink: 0,
    width: featured ? '50%' : '100%',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    borderRadius: '2px',
    background: 'var(--showcase-border, rgba(33, 43, 54, 0.12))',
    [STACKED]: { width: '100%' },
  },
  framedImage,
  mediaAlt: altText,
  altTextLines,
  body: { display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1, minWidth: 0 },
  title,
  badges: row,
  badge: {
    padding: '0 0.5rem',
    border: '1px solid var(--showcase-accent, #00796f)',
    borderRadius: '999px',
    color: 'var(--showcase-accent, #00796f)',
  },
  metadata: { display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.25rem 0.75rem', m: 0 },
  // The muted text reaches only 4.19:1 on the featured tint, below the 4.5:1 text minimum.
  term: { color: featured ? 'var(--showcase-primary, #1f3b50)' : 'var(--showcase-muted-text, #637381)' },
  value: { m: 0, minWidth: 0, overflowWrap: 'anywhere' },
  actions: { ...row, mt: 'auto' },
}) satisfies Record<string, SxProps<Theme>>

const DEFAULT_CARD_SX = buildCardSx(false)
const FEATURED_CARD_SX = buildCardSx(true)

/** The styles for a default or featured card, built once rather than on every render. */
export const cardSx = (featured: boolean) => (featured ? FEATURED_CARD_SX : DEFAULT_CARD_SX)

export const panelSx = {
  panel: frame,
  title,
  actions: row,
} satisfies Record<string, SxProps<Theme>>
