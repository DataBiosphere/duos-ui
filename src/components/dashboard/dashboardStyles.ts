import { Theme } from 'src/libs/theme'

// Shared look of the SO and Researcher console dashboards.

// Brand colors come from the theme; these three have no palette equivalent. Font family inherits,
// since page and MUI theme both resolve to Montserrat.
const MUTED_TEXT = '#6b7280'
const FOCUS_RING = '#2fa4e7'
const PROMO_TEXT = '#d7e2ea'

const focusRing = {
  '&:focus-visible': {
    outline: `3px solid ${FOCUS_RING}`,
    outlineOffset: '3px',
  },
}

const contentWidth = { maxWidth: '900px', mx: 'auto' }

export const titleStyle = {
  ...contentWidth,
  mt: '2rem',
  mb: '10px',
  color: Theme.palette.primary,
  fontSize: '2.8rem',
  fontWeight: 600,
  lineHeight: 'normal',
}

export const headingStyle = {
  ...contentWidth,
  mt: '3rem',
  mb: '10px',
  color: Theme.palette.primary,
  fontSize: '20px',
  fontWeight: 600,
  lineHeight: 'normal',
}

export const gridStyle = {
  ...contentWidth,
  display: 'grid',
  // Single column under 600px, the MUI `sm` breakpoint.
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
  gap: '1.5rem',
  mt: '2rem',
  mb: '2rem',
}

export const cardStyle = {
  'display': 'flex',
  'alignItems': 'flex-start',
  'gap': '1rem',
  'padding': '1.5rem',
  'border': '1.5px solid rgb(0 0 0 / 8%)',
  'borderRadius': '12px',
  'background': Theme.palette.white,
  'color': 'inherit',
  'font': 'inherit',
  'textAlign': 'left',
  'textDecoration': 'none',
  'transition': 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    borderColor: 'rgb(0 0 0 / 18%)',
    boxShadow: '0 8px 24px rgb(0 0 0 / 13%)',
  },
  ...focusRing,
}

export const cardIconStyle = {
  display: 'flex',
  flex: '0 0 48px',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: Theme.palette.background.secondary,
  color: Theme.palette.secondary,
}

export const cardTitleStyle = {
  display: 'block',
  mb: '.35rem',
  color: Theme.palette.primary,
  fontSize: '18px',
  fontWeight: 600,
  lineHeight: 'normal',
}

export const descriptionStyle = {
  display: 'block',
  color: MUTED_TEXT,
  fontSize: '14px',
  lineHeight: 1.4,
}

export const externalIconStyle = {
  ml: '.4rem',
  color: MUTED_TEXT,
  fontSize: '16px',
  verticalAlign: 'middle',
}

export const statsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1.25rem',
  mt: '1rem',
}

export const statStyle = { display: 'flex', flexDirection: 'column' }

export const statValueStyle = {
  color: Theme.palette.secondary,
  fontSize: '20px',
  fontWeight: 700,
  lineHeight: 'normal',
}

export const statLabelStyle = {
  color: MUTED_TEXT,
  fontSize: '12px',
  fontWeight: 500,
  lineHeight: 'normal',
  letterSpacing: '.04em',
  textTransform: 'uppercase',
}

export const promoStyle = {
  ...contentWidth,
  boxSizing: 'border-box',
  mt: '1.5rem',
  mb: '2rem',
  padding: '2rem 2.25rem',
  borderRadius: '12px',
  background: Theme.palette.primary,
  color: PROMO_TEXT,
  fontSize: '14px',
  lineHeight: 1.6,
}

export const promoHeadingStyle = {
  mt: 0,
  mb: '10px',
  color: Theme.palette.white,
  fontSize: '18px',
  fontWeight: 500,
  lineHeight: 1.1,
}

export const promoButtonStyle = {
  'mt': '.5rem',
  'padding': '10px 22px',
  'border': 0,
  'borderRadius': '6px',
  'background': Theme.palette.white,
  'color': Theme.palette.primary,
  'fontSize': '14px',
  'fontWeight': 600,
  'lineHeight': 'normal',
  'textTransform': 'none',
  '&:hover': { background: Theme.palette.white },
  ...focusRing,
}
