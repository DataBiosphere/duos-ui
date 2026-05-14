import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import type { DAAObject } from 'src/types/model'
import { DAA } from 'src/libs/ajax/DAA'
import { DownloadLink } from 'src/components/DownloadLink'

interface DaaTabsProps {
  ownedDaas: DAAObject[]
  sharedDaas: DAAObject[]
  selectedDaa: DAAObject | null | undefined
  onSelectDaa: (daa: DAAObject) => void
  activeTab: 'owned' | 'shared'
  onTabChange: (tab: 'owned' | 'shared') => void
  isLoading?: boolean
}

interface TabPanelProps {
  children?: React.ReactNode
  index: 'owned' | 'shared'
  value: 'owned' | 'shared'
}

function TabPanel(props: TabPanelProps): React.JSX.Element {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`daa-tabpanel-${index}`}
      aria-labelledby={`daa-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function DaaItem({
  specificDaa,
  selectedDaa,
  onChangeSelection,
}: {
  specificDaa: DAAObject
  selectedDaa: DAAObject | null | undefined
  onChangeSelection: (daa: DAAObject) => void
}): React.JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
      <input
        type="radio"
        name="daa"
        checked={selectedDaa?.daaId === specificDaa.daaId}
        onChange={() => onChangeSelection(specificDaa)}
        style={{ accentColor: '#00609f' }}
        data-cy={`daa_option_${specificDaa.daaId}`}
        aria-label={`Use agreement ${specificDaa.file.fileName}`}
      />
      <div style={{ marginLeft: '10px' }}>
        <DownloadLink
          label={specificDaa.file.fileName}
          onDownload={async () => {
            await DAA.getDaaFileById(specificDaa.daaId, specificDaa.file.fileName)
          }}
        />
      </div>
    </div>
  )
}

export function DaaTabs({
  ownedDaas,
  sharedDaas,
  selectedDaa,
  onSelectDaa,
  activeTab,
  onTabChange,
  isLoading = false,
}: Readonly<DaaTabsProps>): React.JSX.Element {
  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'owned' | 'shared') => {
    onTabChange(newValue)
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="DAA selection tabs"
        data-cy="daa_tabs"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tab
          label={`DAC DAAs (${ownedDaas.length})`}
          value="owned"
          id="daa-tab-owned"
          aria-controls="daa-tabpanel-owned"
          data-cy="daa_tab_owned"
          sx={{ textTransform: 'none' }}
        />
        <Tab
          label={`Shared DAAs (${sharedDaas.length})`}
          value="shared"
          id="daa-tab-shared"
          aria-controls="daa-tabpanel-shared"
          data-cy="daa_tab_shared"
          sx={{ textTransform: 'none' }}
        />
      </Tabs>

      <TabPanel value={activeTab} index="owned">
        {isLoading
          ? <div>Loading DAAs...</div>
          : ownedDaas.length === 0
            ? (
                <div style={{ fontStyle: 'italic', color: '#999' }}>
                  No DAAs created by this DAC
                </div>
              )
            : (
                <div>
                  {ownedDaas.map(daa => (
                    <DaaItem
                      key={daa.daaId}
                      specificDaa={daa}
                      selectedDaa={selectedDaa}
                      onChangeSelection={onSelectDaa}
                    />
                  ))}
                </div>
              )}
      </TabPanel>

      <TabPanel value={activeTab} index="shared">
        {isLoading
          ? <div>Loading DAAs...</div>
          : sharedDaas.length === 0
            ? (
                <div style={{ fontStyle: 'italic', color: '#999' }}>
                  No DAAs shared with this DAC
                </div>
              )
            : (
                <div>
                  {sharedDaas.map(daa => (
                    <DaaItem
                      key={daa.daaId}
                      specificDaa={daa}
                      selectedDaa={selectedDaa}
                      onChangeSelection={onSelectDaa}
                    />
                  ))}
                </div>
              )}
      </TabPanel>
    </Box>
  )
}
