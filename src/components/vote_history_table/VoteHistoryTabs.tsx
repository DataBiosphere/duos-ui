import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import { COUNT_BADGE_SX } from 'src/components/data_library/countBadgeStyles'

export const voteHistoryTabId = (key: string) => `vote-history-tab-${key}`
export const voteHistoryTabPanelId = (key: string) => `vote-history-tabpanel-${key}`

export interface VoteHistoryTabConfig {
  key: string
  label: string
  count?: number
}

export interface VoteHistoryTabsProps {
  value: string
  onChange: (key: string) => void
  tabs: VoteHistoryTabConfig[]
}

export const VoteHistoryTabs: React.FC<VoteHistoryTabsProps> = ({ value, onChange, tabs }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={value}
        onChange={(_event, newValue) => onChange(newValue)}
        aria-label="voting history tabs"
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
            id={voteHistoryTabId(tab.key)}
            aria-controls={voteHistoryTabPanelId(tab.key)}
            label={(
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {tab.label}
                {tab.count !== undefined && (
                  <Box
                    component="span"
                    aria-label={`${tab.count} ${tab.count === 1 ? 'item' : 'items'}`}
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

export default VoteHistoryTabs
