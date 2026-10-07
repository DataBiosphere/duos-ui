import React from 'react'
import { MetricsTab } from 'src/components/dar_analytics/MetricsPage'
import { DecisionFunnelSection } from 'src/components/dar_analytics/DecisionFunnelSection'
import { TurnaroundSection } from 'src/components/dar_analytics/TurnaroundSection'
import { SoApprovalsSection } from 'src/components/dar_analytics/SoApprovalsSection'
import { VolumeSection } from 'src/components/dar_analytics/VolumeSection'
import { ExpirationRenewalSection } from 'src/components/dar_analytics/ExpirationRenewalSection'
import { UsersInstitutionsSection } from 'src/components/dar_analytics/UsersInstitutionsSection'
import { DatasetsStudiesSection } from 'src/components/dar_analytics/DatasetsStudiesSection'
import { ElectionsVotesSection } from 'src/components/dar_analytics/ElectionsVotesSection'
import { ResearchTermsSection } from 'src/components/dar_analytics/ResearchTermsSection'

export const METRICS_TABS: MetricsTab[] = [
  { key: 'decisions', label: 'Decisions', render: range => <DecisionFunnelSection range={range} /> },
  { key: 'turnaround', label: 'DAC Turnaround', render: range => <TurnaroundSection range={range} /> },
  { key: 'so-approvals', label: 'SO Approvals', render: range => <SoApprovalsSection range={range} /> },
  { key: 'volume', label: 'Volume', render: range => <VolumeSection range={range} /> },
  { key: 'expiration', label: 'Expiration & Renewal', render: range => <ExpirationRenewalSection range={range} /> },
  { key: 'users', label: 'Users & Institutions', render: range => <UsersInstitutionsSection range={range} /> },
  { key: 'datasets', label: 'Datasets & Studies', render: range => <DatasetsStudiesSection range={range} /> },
  { key: 'elections', label: 'Elections & Votes', render: range => <ElectionsVotesSection range={range} /> },
  { key: 'terms', label: 'Research Terms', render: range => <ResearchTermsSection range={range} /> },
]

export const DAC_METRICS_ROUTE = '/dac_console/metrics'

// Named rather than filtered, so a new admin tab stays off the DAC page until consent scopes it to DACs.
const DAC_TAB_KEYS = new Set(['decisions', 'turnaround', 'volume', 'expiration'])

export const DAC_METRICS_TABS: MetricsTab[] = METRICS_TABS.filter(({ key }) => DAC_TAB_KEYS.has(key))
