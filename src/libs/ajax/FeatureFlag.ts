import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface FeatureFlag {
  id: string
  value: string
  createDate: number
  updateDate: number
}

export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlag> | FeatureFlag[]> {
  const url = `${await Config.getApiUrl()}/feature`
  const res = await fetchGet<Record<string, FeatureFlag> | FeatureFlag[]>(url, Config.authOpts())
  return res.data
}

export async function getFeatureFlag(key: string): Promise<FeatureFlag | undefined> {
  const url = `${await Config.getApiUrl()}/feature/${encodeURIComponent(key)}`
  try {
    const res = await fetchGet<FeatureFlag>(url, Config.authOpts())
    return res.data
  }
  catch {
    return undefined
  }
}

// Cache the NHGRI DAC ID to avoid repeated feature flag lookups
let nhgriDacIdPromise: Promise<string | undefined> | undefined = undefined

export const getFlagNhgriDacId = (): Promise<string | undefined> => {
  nhgriDacIdPromise ??= getFeatureFlag('NHGRI_RESTRICTED_DAC')
    .then(flag => flag?.value)
    .catch(() => undefined)
  return nhgriDacIdPromise
}

// Function to reset the cached NHGRI DAC ID for testing
export const resetNhgriDacIdPromise = () => {
  nhgriDacIdPromise = undefined
}
