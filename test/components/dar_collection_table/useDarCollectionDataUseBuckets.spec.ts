import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDarCollectionDataUseBuckets } from 'src/components/dar_collection_table/useDarCollectionDataUseBuckets'
import { Collections } from 'src/libs/ajax/Collections'
import { binCollectionToBuckets } from 'src/utils/BucketUtils'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DarCollection, DuosUser } from 'src/types/model'
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

    const { result } = renderHook(() => useDarCollectionDataUseBuckets([1], false))

    await waitFor(() => expect(result.current[1]?.status).toBe('loaded'))
    expect(result.current[1]).toEqual({ status: 'loaded', buckets: [bucket] })
    expect(Collections.getCollectionById).toHaveBeenCalledWith(1)
    expect(binCollectionToBuckets).toHaveBeenCalledWith({ darCollectionId: 1 }, [5])
  })

  it('passes an empty dacIds array when isUnfilteredView is true', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 2 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])

    const { result } = renderHook(() => useDarCollectionDataUseBuckets([2], true))

    await waitFor(() => expect(result.current[2]?.status).toBe('loaded'))
    expect(binCollectionToBuckets).toHaveBeenCalledWith({ darCollectionId: 2 }, [])
  })

  it('sets an error state and shows a notification when fetching fails', async () => {
    vi.mocked(Collections.getCollectionById).mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useDarCollectionDataUseBuckets([3], false))

    await waitFor(() => expect(result.current[3]?.status).toBe('error'))
    expect(Notifications.showError).toHaveBeenCalledWith({ text: 'Could not load DAR Collection.' })
  })

  it('does not re-fetch a collection id that has already been requested', async () => {
    vi.mocked(Collections.getCollectionById).mockResolvedValue({ darCollectionId: 1 } as unknown as DarCollection)
    vi.mocked(binCollectionToBuckets).mockResolvedValue([])

    const { result, rerender } = renderHook(
      ({ ids }: { ids: number[] }) => useDarCollectionDataUseBuckets(ids, false),
      { initialProps: { ids: [1] } },
    )

    await waitFor(() => expect(result.current[1]?.status).toBe('loaded'))
    rerender({ ids: [1] })

    expect(Collections.getCollectionById).toHaveBeenCalledTimes(1)
  })
})
