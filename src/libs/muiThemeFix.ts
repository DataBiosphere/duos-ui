import { createTheme } from '@mui/material/styles'

/**
 * Global Material UI Theme Configuration
 *
 * This theme configures MUI to work correctly despite the root HTML font-size
 * being 10px due to bootstrap_replacement.css. Since rem units are calculated
 * relative to root font-size, all MUI default sizes need to be adjusted
 * proportionally.
 *
 * This file should be removed once bootstrap_replacement.css and the custom
 * style overrides set by `sx={ ... }` are removed.
 */
export const muiThemeFix = createTheme({
  typography: {
    htmlFontSize: 10,
    fontFamily: 'Montserrat, Helvetica Neue, Helvetica, Arial, sans-serif',
  },
})

/**
 * Style to set MUI h5 font properties correctly for the Data Library
 */
export const muiH5Fix = { fontSize: '1.5rem', fontWeight: '600' }

/**
 * Style to set MUI filter item font size correctly for the Data Library
 */
const muiDefaultItemFix = { fontSize: '1.3rem' }

/**
 * Style to set MUI Button font properties correctly for the Data Library
 */
export const muiSmallButtonFix = { fontSize: '1rem', fontWeight: '600' }

/**
 * Style to set MUI default header font properties correctly for the Data Library
 */
export const muiHeaderFix = { ...muiDefaultItemFix, fontWeight: '600', marginTop: '1em' }

/**
 * SlotProps style to set MUI TextField font size correctly for the Data Library
 */
export const muiTextFieldFix = {
  input: {
    sx: muiDefaultItemFix,
  },
  inputLabel: {
    sx: muiDefaultItemFix,
  },
}

/**
 * SlotProps style to set MUI ListItemText font size correctly for the Data Library
 */
export const muiListItemTextFix = {
  primary: {
    sx: { ...muiDefaultItemFix, fontWeight: 400 },
  },
}

/**
 * Style to set MUI Checkbox icon size correctly for the Data Library
 */
export const muiCheckboxFix = {
  '& .MuiSvgIcon-root': { fontSize: '1.5rem' },
}
