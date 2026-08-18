import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDarCollectionDataUseBuckets } from 'src/components/dar_collection_table/useDarCollectionDataUseBuckets'
import { Collections } from 'src/libs/ajax/Collections'
import { binCollectionToBuckets } from 'src/utils/BucketUtils'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DarCollection, DarCollectionSummary, DuosUser } from 'src/types/model'
import { Bucket } from 'src/utils/BucketUtils'

vi.mock('src/libs/ajax/Collections', () => ({
  Collections: { getCollectionById: vi.fn() },
}))

vi.mock('src/utils/BucketUtils', () => ({
  binCollectionToBuckets: vi.fn(),
}))

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: vi.fn() },
}))

vi.mock('src/libs/utils', async () => {
  const actual = await vi.importActual<typeof import('src/libs/utils')>('src/libs/utils')
  return { ...actual, Notifications: { showError: vi.fn() } }
})

const makeCollection = (darCollectionId: number, overrides: Partial<DarCollectionSummary> = {}): DarCollectionSummary => ({
  darCollectionId,
  status: 'Open',
  actions: ['Cancel'],
  ...overrides,
} as DarCollectionSummary)

const makeBucket = (overrides: Partial<Bucket> = {}): Bucket => ({
  key: 'bucket-1',
  label: 'GRU',
  datasets: [],
  datasetIds: [],
  elections: [],
  votes: [],
  ...overrides,
} as Bucket)

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(Storage.getCurrentUser).mockReturnValue(
    { userId: 1, roles: [{ dacId: 5 }] } as unknown as DuosUser,
  )
})

describe('useDarCollectionDataUseBuckets', () => {
  it('fetches and bins buckets for each visible collection id', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 1 } as unknown as DarCollection)
    const bucket = makeBucket()
    vi.mocked(binCollectionToBuckets).mockResolvedValue([bucket])

    const { result } = renderHook(() => useDarCollectionDataUseBuckets([makeCollection(1)], false))

    await waitFor(() => expect(result.current[1]?.status).toBe('loaded'))
    expect(result.current[1]).toEqual({ status: 'loaded', buckets: [bucket] })
    expect(Collections.getCollectionById).toHaveBeenCalledWith(1)
    expect(binCollectionToBuckets).toHaveBeenCalledWith({ darCollectionId: 1 }, [5], { includeMatchResults: false })
  })

  it('passes an empty dacIds array when isUnfilteredView is true', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 2 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])

    const { result } = renderHook(() => useDarCollectionDataUseBuckets([makeCollection(2)], true))

    await waitFor(() => expect(result.current[2]?.status).toBe('loaded'))
    expect(binCollectionToBuckets).toHaveBeenCalledWith({ darCollectionId: 2 }, [], { includeMatchResults: false })
  })

  it('sets an error state and shows a notification when fetching fails', async () => {
    vi.mocked(Collections.getCollectionById).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useDarCollectionDataUseBuckets([makeCollection(3)], false))

    await waitFor(() => expect(result.current[3]?.status).toBe('error'))
    expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Could not load DAR Collection.' })
  })

  it('does not re-fetch a collection whose election state is unchanged', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 1 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ collections }: { collections: DarCollectionSummary[] }) => useDarCollectionDataUseBuckets(collections, false),
      { initialProps: { collections: [makeCollection(1)] } },
    )

    await waitFor(() => expect(result.current[1]?.status).toBe('loaded'))
    // A new summary object with the same election state - what search/pagination re-renders produce.
    rerender({ collections: [makeCollection(1)] })

    expect(Collections.getCollectionById).toHaveBeenCalledTimes(1)
  })

  it('re-fetches a collection when its status changes, as it does after an action', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 1 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ collections }: { collections: DarCollectionSummary[] }) => useDarCollectionDataUseBuckets(collections, false),
      { initialProps: { collections: [makeCollection(1, { status: 'Open' })] } },
    )

    await waitFor(() => expect(result.current[1]?.status).toBe('loaded'))
    rerender({ collections: [makeCollection(1, { status: 'Canceled' })] })

    await waitFor(() => expect(Collections.getCollectionById).toHaveBeenCalledTimes(2))
  })

  it('re-fetches a collection when its available actions change', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 1 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ collections }: { collections: DarCollectionSummary[] }) => useDarCollectionDataUseBuckets(collections, false),
      { initialProps: { collections: [makeCollection(1, { actions: ['Cancel'] })] } },
    )

    await waitFor(() => expect(result.current[1]?.status).toBe('loaded'))
    rerender({ collections: [makeCollection(1, { actions: ['Open'] })] })

    await waitFor(() => expect(Collections.getCollectionById).toHaveBeenCalledTimes(2))
  })

  it('retries a failed collection on the next fetch pass rather than pinning the error', async () => {
    vi.mocked(Collections.getCollectionById).mockRejectedValueOnce(new Error('fail'))

    const { result, rerender } = renderHook(
      ({ collections }: { collections: DarCollectionSummary[] }) => useDarCollectionDataUseBuckets(collections, false),
      { initialProps: { collections: [makeCollection(4)] } },
    )

    await waitFor(() => expect(result.current[4]?.status).toBe('error'))

    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 4 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])
    rerender({ collections: [makeCollection(4)] })

    await waitFor(() => expect(result.current[4]?.status).toBe('loaded'))
  })
})
