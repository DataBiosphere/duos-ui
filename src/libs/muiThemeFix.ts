import { createTheme } from '@mui/material/styles'

/**
 * Global Material UI Theme Configuration
 *
 * This theme configures MUI to work correctly despite the root HTML font-size
 * being 10px due to bootstrap_replacement.css. Since rem units are calculated
 * relative to root font-size, all MUI default sizes need to be adjusted
 * proportionally.
 *
 * This file should be removed once bootstrap_replacement.css is removed.
 */
export const muiThemeFix = createTheme({
  typography: {
    htmlFontSize: 10,
    fontFamily: 'Montserrat, Helvetica Neue, Helvetica, Arial, sans-serif',
  },
})

/**
 * Style to set MUI Checkbox icon size correctly for the Data Library
 */
export const muiCheckboxFix = {
  '& .MuiSvgIcon-root': { fontSize: '1.5rem' },
}
