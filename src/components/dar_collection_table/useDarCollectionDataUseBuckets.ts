import { useEffect, useRef, useState } from 'react'
import { Collections } from 'src/libs/ajax/Collections'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { compact, map, uniq } from 'src/utils/NodashUtil'
import { Bucket, binCollectionToBuckets } from 'src/utils/BucketUtils'
import { DarCollection, DarCollectionSummary } from 'src/types/model'

export type DataUseBucketsState
  = | { status: 'loading' }
    | { status: 'loaded', buckets: Bucket[] }
    | { status: 'error' }

const MAX_CONCURRENT_FETCHES = 5

// Buckets carry election and vote state, so they go stale when an action changes the
// collection. Keying the cache on the fields an action alters refetches only what changed.
const collectionSignature = (collection: DarCollectionSummary): string =>
  `${collection.status ?? ''}|${(collection.actions ?? []).join(',')}`

/**
 * Lazily fetches and bins each visible collection's datasets into data-use buckets so the
 * table's Data Use column can render pills/vote-badges without requiring the row to be
 * expanded first. Results are cached per hook instance (per table mount) until the
 * collection's election state changes.
 */
export function useDarCollectionDataUseBuckets(
  visibleCollections: DarCollectionSummary[],
  isUnfilteredView: boolean,
): Record<number, DataUseBucketsState> {
  const [bucketsByCollectionId, setBucketsByCollectionId] = useState<Record<number, DataUseBucketsState>>({})
  const requestedSignatures = useRef<Map<number, string>>(new Map())

  useEffect(() => {
    const collectionsToFetch = visibleCollections.filter(
      collection => requestedSignatures.current.get(collection.darCollectionId) !== collectionSignature(collection),
    )
    if (collectionsToFetch.length === 0) {
      return
    }
    const idsToFetch = collectionsToFetch.map(collection => collection.darCollectionId)
    collectionsToFetch.forEach((collection) => {
      requestedSignatures.current.set(collection.darCollectionId, collectionSignature(collection))
    })
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
        // The table renders only labels, datasets and votes, so skip the per-collection
        // match fetch that the DAR review page needs.
        const buckets = await binCollectionToBuckets(collection, dacIds, { includeMatchResults: false })
        setBucketsByCollectionId(prev => ({ ...prev, [id]: { status: 'loaded', buckets } }))
      }
      catch {
        // Dropped so the next pass retries, rather than pinning the error until remount.
        requestedSignatures.current.delete(id)
        setBucketsByCollectionId(prev => ({ ...prev, [id]: { status: 'error' } }))
        Notifications.showError({ text: 'Could not load DAR Collection.' })
      }
      await runNext()
    }

    const workerCount = Math.min(MAX_CONCURRENT_FETCHES, idsToFetch.length)
    void Promise.all(Array.from({ length: workerCount }, () => runNext()))
  }, [visibleCollections, isUnfilteredView])

  return bucketsByCollectionId
}
