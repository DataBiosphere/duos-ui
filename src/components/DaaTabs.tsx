import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'
import type { DAAObject } from 'src/types/model'
import { DAA } from 'src/libs/ajax/DAA'
import { DownloadLink } from 'src/components/DownloadLink'

interface DaaTabsProps {
  readonly ownedDaas: DAAObject[]
  readonly sharedDaas: DAAObject[]
  readonly selectedDaa: DAAObject | null | undefined
  readonly onSelectDaa: (daa: DAAObject) => void
  readonly activeTab: 'owned' | 'shared'
  readonly onTabChange: (tab: 'owned' | 'shared') => void
  readonly isLoading?: boolean
}

interface TabPanelProps {
  readonly children?: React.ReactNode
  readonly index: 'owned' | 'shared'
  readonly value: 'owned' | 'shared'
}

function TabPanel(props: Readonly<TabPanelProps>): React.JSX.Element {
  const { children, value, index } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`daa-tabpanel-${index}`}
      aria-labelledby={`daa-tab-${index}`}
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
}: Readonly<{
  specificDaa: DAAObject
  selectedDaa: DAAObject | null | undefined
  onChangeSelection: (daa: DAAObject) => void
}>): React.JSX.Element {
  const handleChange = (): void => onChangeSelection(specificDaa)
  const handleDownload = async (): Promise<void> => {
    await DAA.getDaaFileById(specificDaa.daaId, specificDaa.file.fileName)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '15px' }}>
      <input
        type="radio"
        name="daa"
        checked={selectedDaa?.daaId === specificDaa.daaId}
        onChange={handleChange}
        style={{ accentColor: '#00609f' }}
        data-cy={`daa_option_${specificDaa.daaId}`}
        aria-label={`Use agreement ${specificDaa.file.fileName}`}
      />
      <div style={{ marginLeft: '10px' }}>
        <DownloadLink
          label={specificDaa.file.fileName}
          onDownload={handleDownload}
        />
      </div>
    </div>
  )
}

function DaaTabContent({
  daas,
  selectedDaa,
  onSelectDaa,
  isLoading,
  emptyMessage,
}: Readonly<{
  daas: DAAObject[]
  selectedDaa: DAAObject | null | undefined
  onSelectDaa: (daa: DAAObject) => void
  isLoading: boolean
  emptyMessage: string
}>): React.JSX.Element {
  if (isLoading) {
    return <div>Loading DAAs...</div>
  }

  if (daas.length === 0) {
    return (
      <div style={{ fontStyle: 'italic', color: '#999' }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div>
      {daas.map(daa => (
        <DaaItem
          key={daa.daaId}
          specificDaa={daa}
          selectedDaa={selectedDaa}
          onChangeSelection={onSelectDaa}
        />
      ))}
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
          label={`MY DAC's DAAs (${ownedDaas.length})`}
          value="owned"
          id="daa-tab-owned"
          aria-controls="daa-tabpanel-owned"
          data-cy="daa_tab_owned"
          sx={{ textTransform: 'none' }}
        />
        <Tab
          label={`OTHER DAC's DAAs (${sharedDaas.length})`}
          value="shared"
          id="daa-tab-shared"
          aria-controls="daa-tabpanel-shared"
          data-cy="daa_tab_shared"
          sx={{ textTransform: 'none' }}
        />
      </Tabs>

      <TabPanel value={activeTab} index="owned">
        <DaaTabContent
          daas={ownedDaas}
          selectedDaa={selectedDaa}
          onSelectDaa={onSelectDaa}
          isLoading={isLoading}
          emptyMessage="No DAAs created by this DAC"
        />
      </TabPanel>

      <TabPanel value={activeTab} index="shared">
        <DaaTabContent
          daas={sharedDaas}
          selectedDaa={selectedDaa}
          onSelectDaa={onSelectDaa}
          isLoading={isLoading}
          emptyMessage="No DAAs shared with this DAC"
        />
      </TabPanel>
    </Box>
  )
}
