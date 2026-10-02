import React from 'react'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'
import { SoApprovalsSection } from 'src/components/dar_analytics/SoApprovalsSection'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'

export interface MetricsTab {
  /** The `tab` query param, so a tab can be linked to. */
  key: string
  label: string
  render: (range: DarAnalyticsRange) => React.ReactNode
}

export const METRICS_TABS: MetricsTab[] = [
  { key: 'decisions', label: 'Decisions', render: range => <DecisionFunnelSection range={range} /> },
  { key: 'turnaround', label: 'DAC Turnaround', render: range => <TurnaroundSection range={range} /> },
  { key: 'so-approvals', label: 'SO Approvals', render: range => <SoApprovalsSection range={range} /> },
  { key: 'volume', label: 'Volume', render: range => <VolumeSection range={range} /> },
]
