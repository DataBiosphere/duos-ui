import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { useMetricsSearchParams } from 'src/pages/admin_console/useMetricsSearchParams'

const TABS = ['decisions', 'turnaround']

const setup = (search = '') => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={[`/admin_console/metrics${search}`]}>{children}</MemoryRouter>
  )
  return renderHook(() => ({ params: useMetricsSearchParams(TABS), location: useLocation() }), { wrapper })
}

describe('useMetricsSearchParams', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-08-14T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to the first tab and the last two years by quarter', () => {
    const { result } = setup()

    expect(result.current.params.tab).toBe('decisions')
    expect(result.current.params.range).toEqual({ from: '2024-07-01', to: '2026-08-14', bucket: 'quarter' })
  })

  it('reads the tab, range and bucket from the URL', () => {
    const { result } = setup('?tab=turnaround&from=2025-01-01&to=2025-06-30&bucket=month')

    expect(result.current.params.tab).toBe('turnaround')
    expect(result.current.params.range).toEqual({ from: '2025-01-01', to: '2025-06-30', bucket: 'month' })
  })

  it('falls back for an unknown tab, an inverted range and an unknown bucket', () => {
    const { result } = setup('?tab=nope&from=2025-06-30&to=2025-01-01&bucket=year')

    expect(result.current.params.tab).toBe('decisions')
    expect(result.current.params.range).toEqual({ from: '2024-07-01', to: '2026-08-14', bucket: 'quarter' })
  })

  it('changes the tab and keeps the range', () => {
    const { result } = setup('?from=2025-01-01&to=2025-06-30&bucket=month')

    act(() => result.current.params.setTab('turnaround'))

    const search = new URLSearchParams(result.current.location.search)
    expect(search.get('tab')).toBe('turnaround')
    expect(search.get('from')).toBe('2025-01-01')
    expect(search.get('bucket')).toBe('month')
  })

  it('merges a range change into the current range and keeps the tab', () => {
    const { result } = setup('?tab=turnaround')

    act(() => result.current.params.setRange({ bucket: 'week' }))

    expect(result.current.params.tab).toBe('turnaround')
    expect(result.current.params.range).toEqual({ from: '2024-07-01', to: '2026-08-14', bucket: 'week' })
  })

  it('keeps a newer bucket when an older date change applies after it', () => {
    const { result } = setup('?from=2025-01-01&to=2025-06-30&bucket=quarter')
    const staleSetRange = result.current.params.setRange

    act(() => result.current.params.setRange({ bucket: 'month' }))
    act(() => staleSetRange({ from: '2025-02-01', to: '2025-06-30' }))

    expect(result.current.params.range).toEqual({ from: '2025-02-01', to: '2025-06-30', bucket: 'month' })
  })
})
