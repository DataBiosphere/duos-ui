import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { LibraryTabsProps } from 'src/types/library'
import { COUNT_BADGE_SX } from 'src/components/data_library/countBadgeStyles'

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
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
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
            label={(
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {tab.label}
                {tab.count !== undefined && (
                  <Box
                    component="span"
                    aria-label={`${tab.count} items`}
                    sx={{ ...COUNT_BADGE_SX, fontWeight: 'normal' }}
                  >
                    {tab.count.toLocaleString()}
                  </Box>
                )}
              </Box>
            )}
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
