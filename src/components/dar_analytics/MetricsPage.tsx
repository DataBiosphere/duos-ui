import React from 'react'
import { Box, Typography } from '@mui/material'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TabControl from 'src/components/TabControl'
import { descriptionStyle, titleStyle } from 'src/components/dashboard/dashboardStyles'
import { DarAnalyticsControls } from 'src/components/dar_analytics/DarAnalyticsControls'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarMetricsScope } from 'src/components/dar_analytics/useDarMetricsReport'
import { useMetricsSearchParams } from 'src/components/dar_analytics/useMetricsSearchParams'

export interface MetricsTab {
  /** The `tab` query param, so a tab can be linked to. */
  key: string
  label: string
  render: (range: DarAnalyticsRange) => React.ReactNode
}

interface MetricsPageProps {
  tabs: MetricsTab[]
  description: string
  /** Scopes every tab's reports to these DACs; omitted, they cover every DAC. */
  dacIds?: number[]
  /** Shown above the range controls, such as a DAC picker. */
  scopeControl?: React.ReactNode
}

export default function MetricsPage({ tabs, description, dacIds, scopeControl }: Readonly<MetricsPageProps>): React.JSX.Element {
  usePageTitle('Metrics')
  const { tab, range, setTab, setRange } = useMetricsSearchParams(tabs.map(({ key }) => key))
  const active = tabs.find(({ key }) => key === tab)

  return (
    <Box sx={Styles.PAGE}>
      <Typography component="h1" sx={{ ...titleStyle, maxWidth: 'none' }}>Metrics</Typography>
      <Typography sx={descriptionStyle}>{description}</Typography>
      {scopeControl}
      <DarAnalyticsControls range={range} onChange={setRange} />
      {active && (
        <DarMetricsScope.Provider value={dacIds}>
          <TabControl
            labels={tabs.map(({ label }) => label)}
            selectedTab={active.label}
            setSelectedTab={label => setTab(tabs.find(t => t.label === label)?.key ?? active.key)}
            sx={{ mt: '1.5rem' }}
          />
          {active.render(range)}
        </DarMetricsScope.Provider>
      )}
    </Box>
  )
}
