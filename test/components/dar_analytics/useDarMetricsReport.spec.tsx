import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import {
  DarMetricsScope, DarMetricsTargetContext, useDarMetricsReport,
} from 'src/components/dar_analytics/useDarMetricsReport'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { DarMetricsTarget } from 'src/types/darMetrics'

const range: DarAnalyticsRange = { from: '2026-01-01', to: '2026-03-31', bucket: 'month' }

const renderReport = (dacIds?: number[]) => {
  const fetchReport = vi.fn().mockResolvedValue({})
  const client = new QueryClient()
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      <DarMetricsScope.Provider value={dacIds}>{children}</DarMetricsScope.Provider>
    </QueryClientProvider>
  )
  renderHook(() => useDarMetricsReport('decisions', fetchReport, range, { limit: 1 }), { wrapper })
  return fetchReport
}

describe('useDarMetricsReport', () => {
  it('sends the page\'s DAC scope with the range', async () => {
    const fetchReport = renderReport([4, 6])

    await waitFor(() => expect(fetchReport).toHaveBeenCalledWith({ ...range, limit: 1, dacIds: [4, 6] }))
  })

  it('drops the previous figures when the DAC changes, as for another report', async () => {
    const fetchReport = vi.fn().mockResolvedValueOnce({ dac: 4 }).mockReturnValue(new Promise(() => undefined))
    const client = new QueryClient()
    let dacIds = [4]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <DarMetricsScope.Provider value={dacIds}>{children}</DarMetricsScope.Provider>
      </QueryClientProvider>
    )
    const { result, rerender } = renderHook(() => useDarMetricsReport('decisions', fetchReport, range), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual({ dac: 4 }))

    dacIds = [6]
    rerender()

    await waitFor(() => expect(fetchReport).toHaveBeenCalledTimes(2))
    expect(result.current.data).toBeUndefined()
  })

  it('keeps the previous figures across a range change for the same DACs', async () => {
    const fetchReport = vi.fn().mockResolvedValueOnce({ dac: 4 }).mockReturnValue(new Promise(() => undefined))
    const client = new QueryClient()
    let shown = range
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <DarMetricsScope.Provider value={[4]}>{children}</DarMetricsScope.Provider>
      </QueryClientProvider>
    )
    const { result, rerender } = renderHook(() => useDarMetricsReport('decisions', fetchReport, shown), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual({ dac: 4 }))

    shown = { ...range, bucket: 'week' }
    rerender()

    await waitFor(() => expect(fetchReport).toHaveBeenCalledTimes(2))
    expect(result.current.data).toEqual({ dac: 4 })
  })

  it('leaves the scope out when the page sets none', async () => {
    const fetchReport = renderReport()

    await waitFor(() => expect(fetchReport).toHaveBeenCalled())
    expect(fetchReport.mock.calls[0][0].dacIds).toBeUndefined()
    expect(fetchReport.mock.calls[0][0].target).toBeUndefined()
  })

  it('sends the study or dataset the page reports on', async () => {
    const fetchReport = vi.fn().mockResolvedValue({})
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={new QueryClient()}>
        <DarMetricsTargetContext.Provider value={{ kind: 'study', id: '12' }}>{children}</DarMetricsTargetContext.Provider>
      </QueryClientProvider>
    )

    renderHook(() => useDarMetricsReport('volume', fetchReport, range, { limit: 1 }), { wrapper })

    await waitFor(() =>
      expect(fetchReport).toHaveBeenCalledWith({ ...range, limit: 1, target: { kind: 'study', id: '12' } }))
  })

  /** One study's figures left up under another study's page would be mislabelled. */
  it('drops the previous figures when the study changes', async () => {
    const fetchReport = vi.fn().mockResolvedValueOnce({ study: 12 }).mockReturnValue(new Promise(() => undefined))
    const client = new QueryClient()
    let target: DarMetricsTarget = { kind: 'study', id: 12 }
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>
        <DarMetricsTargetContext.Provider value={target}>{children}</DarMetricsTargetContext.Provider>
      </QueryClientProvider>
    )
    const { result, rerender } = renderHook(() => useDarMetricsReport('volume', fetchReport, range), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual({ study: 12 }))

    target = { kind: 'study', id: 13 }
    rerender()

    await waitFor(() => expect(fetchReport).toHaveBeenCalledTimes(2))
    expect(result.current.data).toBeUndefined()
  })

  it('never requests a report its section has turned off', async () => {
    const off = vi.fn().mockResolvedValue({})
    const on = vi.fn().mockResolvedValue({})
    const client = new QueryClient()
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => ({
      off: useDarMetricsReport('decisions', off, range, {}, false),
      on: useDarMetricsReport('dataset-decisions', on, range),
    }), { wrapper })

    await waitFor(() => expect(result.current.on.isSuccess).toBe(true))
    expect(off).not.toHaveBeenCalled()
    expect(result.current.off.isPending).toBe(true)
  })
})
