import React, { useState } from 'react'
import { Alert } from '@mui/material'
import dayjs from 'dayjs'
import TabControl from 'src/components/TabControl'
import { DarAnalyticsControls } from 'src/components/dar_analytics/DarAnalyticsControls'
import { DarAnalyticsRange, defaultRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { ExpirationRenewalSection } from 'src/components/dar_analytics/ExpirationRenewalSection'
import { RequestActivityAccess } from 'src/components/dar_analytics/requestActivityAccess'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'
import { DarMetricsTargetContext } from 'src/components/dar_analytics/useDarMetricsReport'
import { DarMetricsTarget } from 'src/types/darMetrics'

interface TrendTab {
  label: string
  /**
   * True for a report that counts denied and pending requests. Consent serves those to admins and
   * the DAC in charge alone, so they are offered to no one else.
   */
  requestActivity: boolean
  render: (range: DarAnalyticsRange) => React.ReactNode
}

// The Metrics page's sections that consent also serves for one study or dataset.
const TABS: TrendTab[] = [
  { label: 'Volume', requestActivity: true, render: range => <VolumeSection range={range} /> },
  { label: 'Decisions', requestActivity: true, render: range => <DecisionFunnelSection range={range} /> },
  { label: 'Expiration & Renewal', requestActivity: false, render: range => <ExpirationRenewalSection range={range} /> },
  { label: 'DAC Turnaround', requestActivity: true, render: range => <TurnaroundSection range={range} /> },
]

interface DarTrendsProps {
  target: DarMetricsTarget
  /**
   * How much of the reports on every request, granted or not, to offer beside the one on granted
   * access: see `requestActivityAccess`.
   */
  requestActivity: RequestActivityAccess
}

/**
 * DAR activity over time for one study or dataset: the Metrics page's reports, each covering only
 * that study's or dataset's DARs. Consent serves these to whoever can read the page's DAR history,
 * so render this only once that history has loaded; nothing here checks that.
 *
 * Everyone who gets this far sees when granted access expired, was closed out or was renewed. The
 * reports that also count denied and pending requests are offered, and requested, only where
 * `requestActivity` isn't `none`.
 *
 * The range and tab are kept in state, not in the URL as on the Metrics page: these pages have
 * their own address, and trend settings in it would travel with every link to the study.
 */
export const DarTrends = ({ target, requestActivity }: DarTrendsProps) => {
  const [range, setRange] = useState(() => defaultRange(dayjs()))
  const [tab, setTab] = useState<string>()
  const tabs = TABS.filter(tab => requestActivity !== 'none' || !tab.requestActivity)
  // Falls back to the first report on offer, so a tab that is withdrawn is never left open.
  const active = tabs.find(({ label }) => label === tab) ?? tabs[0]

  return (
    <DarMetricsTargetContext.Provider value={target}>
      <DarAnalyticsControls range={range} onChange={change => setRange(current => ({ ...current, ...change }))} />
      {/* Consent narrows a chair's or member's request-activity reports to their own DACs' datasets
          without saying so, and a study can be shared between DACs. The sections' own text speaks
          of the whole study, as it does for an admin, so the difference is stated once here. A
          note, not the alert an Alert is by default: nothing happened that needs announcing. */}
      {requestActivity === 'own-dacs' && target.kind === 'study' && (
        <Alert severity="info" role="note" sx={{ mt: '1.5rem' }}>
          Volume, Decisions and DAC Turnaround count requests for the datasets your DACs are in charge of.
          Expiration &amp; Renewal covers every dataset in the study.
        </Alert>
      )}
      {tabs.length > 1 && (
        <TabControl
          labels={tabs.map(({ label }) => label)}
          selectedTab={active.label}
          setSelectedTab={setTab}
          sx={{ mt: '1.5rem' }}
        />
      )}
      {active.render(range)}
    </DarMetricsTargetContext.Provider>
  )
}
