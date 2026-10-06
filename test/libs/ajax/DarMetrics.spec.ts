import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { DarMetricsQuery } from 'src/types/darMetrics'

vi.mock('src/libs/config', () => ({
  Config: {
    getApiUrl: vi.fn(),
    authOpts: vi.fn(),
  },
}))

vi.mock('src/libs/ajax/fetchAdapter', () => ({
  fetchGet: vi.fn(),
}))

const headers = {
  headers: {
    'Authorization': 'Bearer token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
}

const query: DarMetricsQuery = { from: '2026-01-01', to: '2026-03-31', bucket: 'month' }

describe('DarMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Config.getApiUrl).mockResolvedValue('https://duos.example.org')
    vi.mocked(Config.authOpts).mockReturnValue(headers)
    vi.mocked(fetchGet).mockResolvedValue({ data: {} })
  })

  it.each([
    ['getVolume', 'dar-volume'],
    ['getDecisions', 'dar-decisions'],
    ['getDatasetDecisions', 'dar-dataset-decisions'],
    ['getDecisionTurnaround', 'dar-decision-turnaround'],
    ['getDatasetDecisionTurnaround', 'dar-dataset-decision-turnaround'],
    ['getSoApprovals', 'dar-so-approvals'],
    ['getExpirations', 'dar-expirations'],
    ['getRenewals', 'dar-renewals'],
    ['getUsers', 'users'],
    ['getInstitutions', 'institutions'],
    ['getDarTerms', 'dar-terms'],
  ] as const)('%s gets /api/metrics/%s with the range as query params', async (method, path) => {
    const report = { from: query.from, to: query.to, bucket: 'MONTH', total: 0, buckets: [], rows: [] }
    vi.mocked(fetchGet).mockResolvedValueOnce({ data: report })

    const result = await DarMetrics[method](query)

    expect(fetchGet).toHaveBeenCalledWith(`https://duos.example.org/api/metrics/${path}`, {
      ...headers,
      params: { from: '2026-01-01', to: '2026-03-31', bucket: 'month' },
    })
    expect(result).toEqual(report)
  })

  it('sends paging params and leaves out the ones not given', async () => {
    await DarMetrics.getDecisions({ from: '2026-01-01', to: '2026-03-31', limit: 1, offset: undefined })

    expect(fetchGet).toHaveBeenCalledWith('https://duos.example.org/api/metrics/dar-decisions', {
      ...headers,
      params: { from: '2026-01-01', to: '2026-03-31', limit: 1 },
    })
  })

  it('leaves out an omitted bucket and a null param from untyped callers', async () => {
    const untyped = { from: '2026-01-01', to: '2026-03-31', offset: null } as unknown as DarMetricsQuery

    await DarMetrics.getVolume(untyped)

    expect(fetchGet).toHaveBeenCalledWith('https://duos.example.org/api/metrics/dar-volume', {
      ...headers,
      params: { from: '2026-01-01', to: '2026-03-31' },
    })
  })

  it('sends each DAC as a repeated dacId and leaves out an empty list', async () => {
    await DarMetrics.getRenewals({ ...query, dacIds: [3, 5] })
    await DarMetrics.getRenewals({ ...query, dacIds: [] })

    expect(fetchGet).toHaveBeenNthCalledWith(1, 'https://duos.example.org/api/metrics/dar-renewals', {
      ...headers,
      params: { ...query, dacId: [3, 5] },
    })
    expect(fetchGet).toHaveBeenNthCalledWith(2, 'https://duos.example.org/api/metrics/dar-renewals', {
      ...headers,
      params: query,
    })
  })

  it('propagates a rejection with its status intact', async () => {
    const badRequest = { message: 'to must not be before from', code: 400 }
    vi.mocked(fetchGet).mockRejectedValueOnce(badRequest)

    await expect(DarMetrics.getVolume(query)).rejects.toEqual(badRequest)
  })
})
