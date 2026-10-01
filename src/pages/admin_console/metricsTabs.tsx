import React from 'react'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'

export interface MetricsTab {
  /** The `tab` query param, so a tab can be linked to. */
  key: string
  label: string
  render: (range: DarAnalyticsRange) => React.ReactNode
}

export const METRICS_TABS: MetricsTab[] = [
  { key: 'decisions', label: 'Decisions', render: range => <DecisionFunnelSection range={range} /> },
  { key: 'volume', label: 'Volume', render: range => <VolumeSection range={range} /> },
]
