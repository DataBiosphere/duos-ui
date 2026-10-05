import React from 'react'
import { MetricsTab } from 'src/components/dar_analytics/MetricsPage'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'
import { SoApprovalsSection } from 'src/components/dar_analytics/SoApprovalsSection'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'
import { ExpirationRenewalSection } from 'src/components/dar_analytics/ExpirationRenewalSection'

export const METRICS_TABS: MetricsTab[] = [
  { key: 'decisions', label: 'Decisions', render: range => <DecisionFunnelSection range={range} /> },
  { key: 'turnaround', label: 'DAC Turnaround', render: range => <TurnaroundSection range={range} /> },
  { key: 'so-approvals', label: 'SO Approvals', render: range => <SoApprovalsSection range={range} /> },
  { key: 'volume', label: 'Volume', render: range => <VolumeSection range={range} /> },
  { key: 'expiration', label: 'Expiration & Renewal', render: range => <ExpirationRenewalSection range={range} /> },
]

export const DAC_METRICS_ROUTE = '/dac_console/metrics'

/** SO approvals have no DAC dimension, so DACs get every other tab. */
export const DAC_METRICS_TABS: MetricsTab[] = METRICS_TABS.filter(({ key }) => key !== 'so-approvals')
