import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

type FeatureFlagValue = string

export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlagValue> | FeatureFlagValue[]> {
  const url = `${await Config.getApiUrl()}/feature`
  const res = await fetchGet<Record<string, FeatureFlagValue> | FeatureFlagValue[]>(url, Config.authOpts())
  return res.data
}

export async function getFeatureFlag(key: string): Promise<FeatureFlagValue | undefined> {
  const url = `${await Config.getApiUrl()}/feature/${encodeURIComponent(key)}`
  try {
    const res = await fetchGet<FeatureFlagValue>(url, Config.authOpts())
    return res.data
  }
  catch {
    return undefined
  }
}

// Cache the ES index key name to avoid repeated feature flag lookups
let esIndexKeyNamePromise: Promise<string> | undefined = undefined

export const getFlagEsIndexKeyName = (): Promise<string> => {
  if (esIndexKeyNamePromise === undefined) {
    esIndexKeyNamePromise = getFeatureFlag('ES_TYPE_TO_INDEX_ENABLED').then((flag) => {
      return flag === 'true' ? '_index' : '_type'
    }).catch(() => {
      return '_type'
    })
  }
  return esIndexKeyNamePromise
}

// Function to reset the cached ES index key name for testing
export const resetEsIndexKeyNamePromise = () => {
  esIndexKeyNamePromise = undefined
}
