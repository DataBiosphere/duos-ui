import { type TabStyleOverride } from 'src/components/SelectableText'
import { Theme } from 'src/libs/theme'

export const tabContainerColor = 'white'

export const tabStyleOverride: TabStyleOverride = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: 'clamp(1.15rem, 1.9vw, 1.4rem)',
    width: 'fit-content',
    display: 'flex',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    padding: '0.9rem 0.2rem',
  },
  tabSelected: {
    backgroundColor: 'transparent',
    color: Theme.palette.primary,
    fontWeight: 600,
    borderBottom: `2px solid ${Theme.palette.secondary}`,
  },
  tabUnselected: {
    backgroundColor: 'transparent',
    color: '#7c8a94',
    fontWeight: 400,
    borderBottom: '2px solid transparent',
  },
  // Hover changes color only; the default hover style bolds the label, which reflows the tab row.
  tabHover: {
    color: Theme.palette.primary,
    cursor: 'pointer',
  },
  tabContainer: {
    backgroundColor: tabContainerColor,
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: '2.2rem',
    borderBottom: '1px solid rgba(31, 59, 80, 0.15)',
    padding: '0 0.4rem',
  },
}
