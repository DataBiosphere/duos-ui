import { describe, expect, it } from 'vitest'
import { DAC_METRICS_TABS, METRICS_TABS } from 'src/pages/admin_console/metricsTabs'

describe('metricsTabs', () => {
  it('gives DACs only the tabs consent scopes to DACs, in the admin order', () => {
    expect(DAC_METRICS_TABS.map(({ key }) => key)).toEqual(['decisions', 'turnaround', 'volume', 'expiration'])
    expect(METRICS_TABS.map(({ key }) => key)).toContain('so-approvals')
  })
})
