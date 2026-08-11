import React from 'react'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { SxProps, Theme as MuiTheme } from '@mui/material/styles'

export interface TabControlProps {
  labels: string[]
  selectedTab: string
  setSelectedTab: (label: string) => void
  isLoading?: boolean
  sx?: SxProps<MuiTheme>
  isDisabled?: boolean
}

const baseTabsSx: SxProps<MuiTheme> = {
  'backgroundColor': 'white',
  '& .MuiTab-root': { textTransform: 'none' },
}

export default function TabControl({ labels, selectedTab, setSelectedTab, isLoading = false, sx, isDisabled }: Readonly<TabControlProps>) {
  if (isLoading) {
    return (
      <div className="tab-list" style={{ display: 'flex', backgroundColor: 'white' }}>
        {labels.map(label => (
          <div
            className="text-placeholder"
            key={`${label}-placeholder`}
            style={{ width: '23rem', height: '5rem', marginRight: '2rem' }}
          />
        ))}
      </div>
    )
  }

  return (
    <Tabs
      className="tab-list"
      // MUI warns on a value matching no tab, which happens while the tab set is still resolving.
      value={labels.includes(selectedTab) ? selectedTab : false}
      onChange={(_event, label: string) => setSelectedTab(label)}
      variant="scrollable"
      scrollButtons={false}
      sx={[baseTabsSx, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {labels.map(label => (
        <Tab
          key={`${label}-tab`}
          label={label}
          value={label}
          disabled={isDisabled}
        />
      ))}
    </Tabs>
  )
}
