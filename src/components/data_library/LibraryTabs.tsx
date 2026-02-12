import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { LibraryTabsProps } from 'src/types/library'

export const LibraryTabs: React.FC<LibraryTabsProps> = ({
  value,
  onChange,
  tabs,
}) => {
  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        paddingLeft: '5rem',
        paddingRight: '5rem',
      }}
    >
      <Tabs
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        aria-label="library view tabs"
        slotProps={{
          indicator: {
            style: { backgroundColor: '#00609f' },
          },
        }}
      >
        {tabs.map(tab => (
          <Tab
            key={tab.key}
            value={tab.key}
            label={tab.label}
            sx={{
              textTransform: 'none',
              fontSize: '15px',
              fontFamily: 'Montserrat, sans-serif',
              color: '#00609f',
              fontWeight: value === tab.key ? 'bold' : 'normal',
              padding: '0 25px',
            }}
          />
        ))}
      </Tabs>
    </Box>
  )
}

export default LibraryTabs
