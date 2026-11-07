/**
 * MUI `sx` styles for the showcase hero (DT-4355, S3.3), kept out of the component file so fast
 * refresh works. Colors and type sizes are the showcase template's custom properties, so a theme
 * preset or override still applies. Provisional (D15): spacing.
 */
import type { SxProps, Theme } from '@mui/material/styles'

/** Lists without bullets, laid out in a wrapping row. */
const linkRow: SxProps<Theme> = { display: 'flex', flexWrap: 'wrap', gap: '8px 24px', m: 0, p: 0, listStyle: 'none' }

export const heroSx = {
  // A static decoration from the theme colors, with no image (MVP).
  root: {
    background: 'radial-gradient(circle at 100% 0%, var(--showcase-accent-tint) 0, transparent 60%), var(--showcase-surface)',
    borderBottom: '1px solid var(--showcase-border)',
  },
  // The intro column sits beside the announcements on desktop and stacks below 980px.
  inner: {
    'display': 'grid',
    'gap': '24px',
    'maxWidth': '1400px',
    'mx': 'auto',
    'px': '16px',
    'py': '32px',
    '@media (min-width: 980px)': { gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', alignItems: 'start', gap: '48px', py: '48px' },
  },
  title: { m: 0, color: 'var(--showcase-primary)' },
  // Body text color, not the muted text: muted text is under 4.5:1 on the accent tint behind it.
  subtitle: { mt: '8px', mb: 0, fontSize: 'var(--showcase-font-size-card-title)' },
  text: { mt: '16px', mb: 0, maxWidth: '70ch', whiteSpace: 'pre-line' },
  // Provisional (D15): the strip stacks at 480px.
  stats: { 'm': '24px 0 0', 'p': 0, 'listStyle': 'none', 'gap': '16px 40px', 'flexWrap': 'wrap', '@media (max-width: 480px)': { flexDirection: 'column' } },
  statValue: {
    fontFamily: 'var(--showcase-font-heading)',
    fontSize: 'var(--showcase-font-size-page-title)',
    fontWeight: 'var(--showcase-font-weight-heading)',
    lineHeight: 'var(--showcase-line-height-heading)',
    color: 'var(--showcase-primary)',
  },
  statLabel: { fontSize: 'var(--showcase-font-size-label)', color: 'var(--showcase-muted-text)' },
  ctas: { ...linkRow, mt: '24px', fontWeight: 600 },
  onboarding: { mt: '24px' },
  onboardingLinks: linkRow,
  announcements: { p: '16px', borderColor: 'var(--showcase-border)', borderRadius: '8px', bgcolor: 'var(--showcase-surface)' },
  announcement: { minHeight: '3em' },
  announcementControls: { mt: '12px', alignItems: 'center' },
  // 44px targets; the template's focus ring still applies to the button.
  announcementButton: { 'width': '44px', 'height': '44px', 'border': '1px solid var(--showcase-border-strong)', 'borderRadius': '4px', 'color': 'var(--showcase-primary)', '& svg': { fontSize: '24px' } },
  announcementPosition: { fontSize: 'var(--showcase-font-size-label)', color: 'var(--showcase-muted-text)' },
  // `&&` doubles the class, so it beats the template's `.showcase-template h2` size.
  subheading: {
    '&&': { m: '0 0 8px', fontSize: 'var(--showcase-font-size-label)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--showcase-muted-text)' },
  },
} satisfies Record<string, SxProps<Theme>>
