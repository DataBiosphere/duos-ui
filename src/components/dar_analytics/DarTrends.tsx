import React, { useState } from 'react'
import { Box } from '@mui/material'
import dayjs from 'dayjs'
import TabControl from 'src/components/TabControl'
import { DarMetricsSubject } from 'src/types/darMetrics'
import { DarAnalyticsControls } from 'src/components/dar_analytics/DarAnalyticsControls'
import { DarAnalyticsRange, defaultRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarMetricsSubjectScope } from 'src/components/dar_analytics/useDarMetricsReport'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { ExpirationRenewalSection } from 'src/components/dar_analytics/ExpirationRenewalSection'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'

interface TrendReport {
  label: string
  render: (range: DarAnalyticsRange) => React.ReactNode
}

/** The Metrics page's sections that make sense for one study or dataset; the rest report on DUOS as a whole. */
const TREND_REPORTS: TrendReport[] = [
  { label: 'Volume', render: range => <VolumeSection range={range} /> },
  { label: 'Decisions', render: range => <DecisionFunnelSection range={range} /> },
  { label: 'Expiration and renewal', render: range => <ExpirationRenewalSection range={range} /> },
  { label: 'Turnaround', render: range => <TurnaroundSection range={range} /> },
]

/**
 * DAR reports over time for a study's or a dataset's DARs, built from the Metrics page's sections
 * so the two describe the same figures in the same way. The range and report live in component
 * state rather than the URL: these pages have their own query params, and Metrics' would collide.
 */
export const DarTrends = ({ subject }: { subject: DarMetricsSubject }) => {
  const [range, setRange] = useState<DarAnalyticsRange>(() => defaultRange(dayjs()))
  const [selected, setSelected] = useState(TREND_REPORTS[0].label)
  const active = TREND_REPORTS.find(({ label }) => label === selected) ?? TREND_REPORTS[0]

  const changeRange = (change: Partial<DarAnalyticsRange>) => setRange(current => ({
    ...current,
    ...Object.fromEntries(Object.entries(change).filter(([, value]) => value !== undefined)),
  }))

  return (
    <DarMetricsSubjectScope.Provider value={subject}>
      <Box>
        <DarAnalyticsControls range={range} onChange={changeRange} />
        <TabControl
          labels={TREND_REPORTS.map(({ label }) => label)}
          selectedTab={active.label}
          setSelectedTab={setSelected}
          sx={{ mt: '1.5rem' }}
        />
        {active.render(range)}
      </Box>
    </DarMetricsSubjectScope.Provider>
  )
}

export default DarTrends
