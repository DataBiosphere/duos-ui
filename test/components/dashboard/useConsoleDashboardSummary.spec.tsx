import React from 'react'
import '@testing-library/jest-dom/vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ConsoleDashboardTileMeta,
  isRenderedForUser,
  useConsoleDashboardSummary,
} from 'src/components/dashboard/useConsoleDashboardSummary'
import { Notifications } from 'src/libs/utils'
import { DuosUser } from 'src/types/model'

interface Summary {
  dataLibrary?: { studies?: number, datasets?: number }
  darRequests?: { total?: number }
}

const TileIcon = () => <svg data-testid="tile-icon" />

const tileMeta: ConsoleDashboardTileMeta<Summary>[] = [
  {
    label: 'Data Library',
    link: '/datalibrary',
    icon: TileIcon,
    description: 'Browse and search datasets.',
    stats: [
      { label: 'Studies', value: s => s?.dataLibrary?.studies },
      { label: 'Datasets', value: s => s?.dataLibrary?.datasets },
    ],
  },
  {
    label: 'Data Access Requests',
    link: '/researcher_console',
    icon: TileIcon,
    description: 'Track your requests.',
    stats: [{ label: 'Total', value: s => s?.darRequests?.total }],
  },
]

const summary: Summary = {
  dataLibrary: { studies: 7, datasets: 12 },
  darRequests: { total: 8 },
}

const newClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

const renderSummaryHook = (
  queryFn: () => Promise<Summary>,
  client = newClient(),
  meta = tileMeta,
) => renderHook(
  () => useConsoleDashboardSummary(['dashboard-summary'], queryFn, meta),
  {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  },
)

// Flattens tiles to `label: value` pairs so a test can assert every count at once.
const statValues = (tiles: { stats: { label: string, value: number | null }[] }[]) =>
  Object.fromEntries(tiles.flatMap(tile => tile.stats.map(stat => [stat.label, stat.value])))

describe('isRenderedForUser', () => {
  const user = { userId: 1, isDataSubmitter: false } as unknown as DuosUser

  it('renders an entry that declares no predicate', () => {
    expect(isRenderedForUser(undefined, user)).toBe(true)
  })

  it('renders an entry whose predicate approves the user', () => {
    expect(isRenderedForUser(() => true, user)).toBe(true)
  })

  it('hides an entry whose predicate rejects the user', () => {
    expect(isRenderedForUser(u => u.isDataSubmitter === true, user)).toBe(false)
  })

  it('hides an entry whose predicate cannot decide, rather than revealing it', () => {
    // The exact case of a stored user missing the role flag the predicate reads.
    const predicate = (u: DuosUser) => (u as unknown as { missing?: boolean }).missing as boolean
    expect(isRenderedForUser(predicate, {} as DuosUser)).toBe(false)
    expect(predicate({} as DuosUser)).toBeUndefined()
  })
})

describe('useConsoleDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(Notifications, 'showError').mockImplementation(() => undefined)
  })

  it('reports loading with blank counts before the request settles', () => {
    const queryFn = vi.fn(() => new Promise<Summary>(() => undefined))

    const { result } = renderSummaryHook(queryFn)

    expect(result.current.isLoading).toBe(true)
    expect(statValues(result.current.tiles)).toEqual({ Studies: null, Datasets: null, Total: null })
    // Presentation metadata is available immediately; only the counts wait on the request.
    expect(result.current.tiles.map(tile => tile.link)).toEqual(['/datalibrary', '/researcher_console'])
    expect(result.current.tiles[0].icon).toBe(TileIcon)
    expect(result.current.tiles[0].description).toBe('Browse and search datasets.')
  })

  it('fills each tile\'s counts from a single summary request', async () => {
    const queryFn = vi.fn().mockResolvedValue(summary)

    const { result } = renderSummaryHook(queryFn)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(statValues(result.current.tiles)).toEqual({ Studies: 7, Datasets: 12, Total: 8 })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('blanks a count the payload omits instead of letting the accessor throw', async () => {
    const queryFn = vi.fn().mockResolvedValue({ darRequests: { total: 8 } } as Summary)

    const { result } = renderSummaryHook(queryFn)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(statValues(result.current.tiles)).toEqual({ Studies: null, Datasets: null, Total: 8 })
  })

  it('blanks any count that is not a finite number', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      dataLibrary: { studies: Number.NaN, datasets: '12' as unknown as number },
      darRequests: { total: Number.POSITIVE_INFINITY },
    } as Summary)

    const { result } = renderSummaryHook(queryFn)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(statValues(result.current.tiles)).toEqual({ Studies: null, Datasets: null, Total: null })
  })

  it('keeps a zero count, which is data rather than an absent value', async () => {
    const queryFn = vi.fn().mockResolvedValue({
      dataLibrary: { studies: 0, datasets: 0 },
      darRequests: { total: 0 },
    } as Summary)

    const { result } = renderSummaryHook(queryFn)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(statValues(result.current.tiles)).toEqual({ Studies: 0, Datasets: 0, Total: 0 })
  })

  it('notifies the user once, and leaves counts blank, when the request fails', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('backend unavailable'))

    const { result } = renderSummaryHook(queryFn)

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: backend unavailable',
    }))
    expect(Notifications.showError).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(false)
    expect(statValues(result.current.tiles)).toEqual({ Studies: null, Datasets: null, Total: null })
  })

  it('describes a failure that carries no message rather than announcing nothing', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error(''))

    renderSummaryHook(queryFn)

    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledWith({
      text: 'Error: Unable to load dashboard statistics: Unknown error',
    }))
  })

  it('hides cached counts while a mount refetch is in flight', async () => {
    const client = newClient()
    client.setQueryData(['dashboard-summary'], summary)
    let resolveSummary: (value: Summary) => void = () => undefined
    const queryFn = vi.fn(() => new Promise<Summary>(resolve => resolveSummary = resolve))

    const { result } = renderSummaryHook(queryFn, client)

    // Stale and fresh numbers must never mix, so the cached values blank out until this
    // request answers.
    expect(result.current.isLoading).toBe(true)
    expect(statValues(result.current.tiles)).toEqual({ Studies: null, Datasets: null, Total: null })

    resolveSummary({ dataLibrary: { studies: 9, datasets: 13 }, darRequests: { total: 1 } })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(statValues(result.current.tiles)).toEqual({ Studies: 9, Datasets: 13, Total: 1 })
  })

  it('does not replay a cached failure as a toast when the dashboard is revisited', async () => {
    const client = newClient()
    // A query that loaded at least once keeps its data, so a later failure leaves both data and
    // error in the cache - the state react-query hands straight back to the next mount.
    client.setQueryData(['dashboard-summary'], summary)
    const failing = vi.fn().mockRejectedValue(new Error('backend unavailable'))

    const first = renderSummaryHook(failing, client)
    await waitFor(() => expect(Notifications.showError).toHaveBeenCalledTimes(1))
    first.unmount()

    let resolveSummary: (value: Summary) => void = () => undefined
    const pending = vi.fn(() => new Promise<Summary>(resolve => resolveSummary = resolve))
    const { result } = renderSummaryHook(pending, client)

    expect(Notifications.showError).toHaveBeenCalledTimes(1)
    expect(statValues(result.current.tiles)).toEqual({ Studies: null, Datasets: null, Total: null })

    resolveSummary(summary)
    await waitFor(() => expect(statValues(result.current.tiles)).toEqual({
      Studies: 7, Datasets: 12, Total: 8,
    }))
    expect(Notifications.showError).toHaveBeenCalledTimes(1)
  })

  it('refetches on every mount so a revisited dashboard shows current counts', async () => {
    const client = newClient()
    const queryFn = vi.fn().mockResolvedValue(summary)

    const first = renderSummaryHook(queryFn, client)
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    first.unmount()

    const { result } = renderSummaryHook(queryFn, client)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('returns no tiles when every tile has been filtered out for this user', async () => {
    const queryFn = vi.fn().mockResolvedValue(summary)

    const { result } = renderSummaryHook(queryFn, newClient(), [])

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.tiles).toEqual([])
    // The summary is still requested: the caller decides what to show, not whether to ask.
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
