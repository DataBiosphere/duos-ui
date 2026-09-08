import { SxProps, Theme } from '@mui/material'

/**
 * Brand color shared by the count badges and the per-section active-filter dot
 * in `LibraryFilters`.
 */
export const COUNT_BADGE_COLOR = '#00609f'

/**
 * Shared pill style for the small numeric count badges in the Data Library
 * (tab item counts in `LibraryTabs`, active-filter count in `LibraryFilters`).
 * Kept in one place so the badge shape and brand color stay in sync; callers
 * override `fontWeight` (and add interaction styles) as needed.
 */
export const COUNT_BADGE_SX: SxProps<Theme> = {
  fontSize: '12px',
  lineHeight: 1,
  color: COUNT_BADGE_COLOR,
  backgroundColor: 'rgba(0, 96, 159, 0.1)',
  borderRadius: '10px',
  padding: '2px 8px',
}
