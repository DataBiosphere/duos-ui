import type { SxProps, Theme } from '@mui/material/styles'

/**
 * Sizes an MUI icon like a character of the text around it, as the old
 * icon font did. MUI draws inside a padded 24px box, so the icon needs
 * 1.25em to match a glyph's 1em, and drops below the baseline to stay centred.
 */
export const inlineIconSx: SxProps<Theme> = { fontSize: '1.25em', verticalAlign: '-0.25em' }
