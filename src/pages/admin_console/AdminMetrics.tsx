import React from 'react'
import MetricsPage from 'src/components/dar_analytics/MetricsPage'
import { METRICS_TABS } from './metricsTabs'

export default function AdminMetrics(): React.JSX.Element {
  return (
    <MetricsPage
      tabs={METRICS_TABS}
      description="How data access requests move through DUOS, and the accounts, institutions, datasets and studies created on it. The range and grouping apply to every tab."
    />
  )
}
