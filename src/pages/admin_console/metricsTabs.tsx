import React from 'react'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'

export interface MetricsTab {
  /** The `tab` query param, so a tab can be linked to. */
  key: string
  label: string
  render: (range: DarAnalyticsRange) => React.ReactNode
}

export const METRICS_TABS: MetricsTab[] = []
