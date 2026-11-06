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
  inner: { display: 'grid', gap: '24px', maxWidth: '1400px', mx: 'auto', px: '16px', py: '32px' },
  title: { m: 0, color: 'var(--showcase-primary)' },
  subtitle: { mt: '8px', mb: 0, fontSize: 'var(--showcase-font-size-card-title)', color: 'var(--showcase-muted-text)' },
  text: { mt: '16px', mb: 0, maxWidth: '70ch', whiteSpace: 'pre-line' },
  ctas: { ...linkRow, mt: '24px', fontWeight: 600 },
  onboarding: { mt: '24px' },
  onboardingLinks: linkRow,
  // `&&` doubles the class, so it beats the template's `.showcase-template h2` size.
  subheading: {
    '&&': { m: '0 0 8px', fontSize: 'var(--showcase-font-size-label)', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--showcase-muted-text)' },
  },
} satisfies Record<string, SxProps<Theme>>
