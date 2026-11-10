import React, { useState } from 'react'
import dayjs from 'dayjs'
import TabControl from 'src/components/TabControl'
import { DarAnalyticsControls } from 'src/components/dar_analytics/DarAnalyticsControls'
import { DarAnalyticsRange, defaultRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { ExpirationRenewalSection } from 'src/components/dar_analytics/ExpirationRenewalSection'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'
import { DarMetricsTargetContext } from 'src/components/dar_analytics/useDarMetricsReport'
import { DarMetricsTarget } from 'src/types/darMetrics'

interface TrendTab {
  label: string
  render: (range: DarAnalyticsRange) => React.ReactNode
}

// The Metrics page's sections that consent also serves for one study or dataset.
const TABS: TrendTab[] = [
  { label: 'Volume', render: range => <VolumeSection range={range} /> },
  { label: 'Decisions', render: range => <DecisionFunnelSection range={range} /> },
  { label: 'Expiration & Renewal', render: range => <ExpirationRenewalSection range={range} /> },
  { label: 'DAC Turnaround', render: range => <TurnaroundSection range={range} /> },
]

/**
 * DAR activity over time for one study or dataset: the Metrics page's reports, each covering only
 * that study's or dataset's DARs. Consent serves these to whoever can read the page's DAR history,
 * so render this only once that history has loaded; nothing here checks access.
 *
 * The range and tab are kept in state, not in the URL as on the Metrics page: these pages have
 * their own address, and trend settings in it would travel with every link to the study.
 */
export const DarTrends = ({ target }: { target: DarMetricsTarget }) => {
  const [range, setRange] = useState(() => defaultRange(dayjs()))
  const [tab, setTab] = useState(TABS[0].label)
  const active = TABS.find(({ label }) => label === tab) ?? TABS[0]

  return (
    <DarMetricsTargetContext.Provider value={target}>
      <DarAnalyticsControls range={range} onChange={change => setRange(current => ({ ...current, ...change }))} />
      <TabControl
        labels={TABS.map(({ label }) => label)}
        selectedTab={active.label}
        setSelectedTab={setTab}
        sx={{ mt: '1.5rem' }}
      />
      {active.render(range)}
    </DarMetricsTargetContext.Provider>
  )
}
