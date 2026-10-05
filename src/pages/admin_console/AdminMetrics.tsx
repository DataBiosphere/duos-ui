import React from 'react'
import { Box, Typography } from '@mui/material'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TabControl from 'src/components/TabControl'
import { descriptionStyle, titleStyle } from 'src/components/dashboard/dashboardStyles'
import { DarAnalyticsControls } from 'src/components/dar_analytics/DarAnalyticsControls'
import { METRICS_TABS } from './metricsTabs'
import { useMetricsSearchParams } from './useMetricsSearchParams'

export default function AdminMetrics(): React.JSX.Element {
  usePageTitle('Metrics')
  const { tab, range, setTab, setRange } = useMetricsSearchParams(METRICS_TABS.map(({ key }) => key))
  const active = METRICS_TABS.find(({ key }) => key === tab)

  return (
    <Box sx={Styles.PAGE}>
      <Typography component="h1" sx={{ ...titleStyle, maxWidth: 'none' }}>Metrics</Typography>
      <Typography sx={descriptionStyle}>
        How data access requests move through DUOS, and the accounts and institutions created on it. The range and grouping apply to every tab.
      </Typography>
      <DarAnalyticsControls range={range} onChange={setRange} />
      {active && (
        <>
          <TabControl
            labels={METRICS_TABS.map(({ label }) => label)}
            selectedTab={active.label}
            setSelectedTab={label => setTab(METRICS_TABS.find(t => t.label === label)?.key ?? active.key)}
            sx={{ mt: '1.5rem' }}
          />
          {active.render(range)}
        </>
      )}
    </Box>
  )
}
