import { SxProps, Theme as MuiTheme } from '@mui/material/styles'
import { Theme } from 'src/libs/theme'

export const tabContainerColor = 'white'

// Only colour and the indicator distinguish the tabs, so neither hover nor selection reflows the row.
export const reviewTabsSx: SxProps<MuiTheme> = {
  'backgroundColor': tabContainerColor,
  'borderBottom': '1px solid rgba(31, 59, 80, 0.15)',
  'minHeight': 'auto',
  '& .MuiTabs-indicator': { backgroundColor: Theme.palette.secondary },
  '& .MuiTab-root': {
    fontSize: 'clamp(1.15rem, 1.9vw, 1.4rem)',
    color: '#7c8a94',
    minHeight: 'auto',
    padding: '0.9rem 1.1rem',
  },
  '& .MuiTab-root.Mui-selected': { color: Theme.palette.primary },
}
