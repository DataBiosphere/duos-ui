import { useEffect, useRef, useState } from 'react'
import { Collections } from 'src/libs/ajax/Collections'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { compact, map, uniq } from 'src/utils/NodashUtil'
import { Bucket, binCollectionToBuckets } from 'src/utils/BucketUtils'
import { DarCollection } from 'src/types/model'

export type DataUseBucketsState
  = | { status: 'loading' }
    | { status: 'loaded', buckets: Bucket[] }
    | { status: 'error' }

const MAX_CONCURRENT_FETCHES = 5

/**
 * Lazily fetches and bins each visible collection's datasets into data-use buckets so the
 * table's Data Use column can render pills/vote-badges without requiring the row to be
 * expanded first. Results are cached permanently per hook instance (per table mount).
 */
export function useDarCollectionDataUseBuckets(
  visibleCollectionIds: number[],
  isUnfilteredView: boolean,
): Record<number, DataUseBucketsState> {
  const [bucketsByCollectionId, setBucketsByCollectionId] = useState<Record<number, DataUseBucketsState>>({})
  const requestedIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    const idsToFetch = visibleCollectionIds.filter(id => !requestedIds.current.has(id))
    if (idsToFetch.length === 0) {
      return
    }
    idsToFetch.forEach(id => requestedIds.current.add(id))
    setBucketsByCollectionId((prev) => {
      const next = { ...prev }
      idsToFetch.forEach((id) => {
        next[id] = { status: 'loading' }
      })
      return next
    })

    const dacIds = isUnfilteredView
      ? []
      : uniq(compact(map(Storage.getCurrentUser().roles, r => r.dacId))) as number[]

    let cursor = 0
    const runNext = async (): Promise<void> => {
      const index = cursor
      cursor += 1
      if (index >= idsToFetch.length) {
        return
      }
      const id = idsToFetch[index]
      try {
        const collection: DarCollection = await Collections.getCollectionById(id)
        const buckets = await binCollectionToBuckets(collection, dacIds)
        setBucketsByCollectionId(prev => ({ ...prev, [id]: { status: 'loaded', buckets } }))
      }
      catch {
        setBucketsByCollectionId(prev => ({ ...prev, [id]: { status: 'error' } }))
        Notifications.showError({ text: 'Could not load DAR Collection.' })
      }
      await runNext()
    }

    const workerCount = Math.min(MAX_CONCURRENT_FETCHES, idsToFetch.length)
    void Promise.all(Array.from({ length: workerCount }, () => runNext()))
  }, [visibleCollectionIds, isUnfilteredView])

  return bucketsByCollectionId
}
