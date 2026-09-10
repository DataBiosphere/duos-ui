import { BFF_PUBLIC_FEATURES_PREFIX, Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface FeatureFlag {
  id: string
  value: string
  createDate: number
  updateDate: number
}

// Public routes allow pre-login reads. This module currently has no app callers;
// retain it for future use per ADR-013 and validate routing through tests.
const featuresUrl = async (path: string): Promise<string> => {
  if (await Config.isBffEnabled()) {
    return `${BFF_PUBLIC_FEATURES_PREFIX}${path}`
  }
  return `${await Config.getUpstreamApiUrl()}/feature${path}`
}

export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlag> | FeatureFlag[]> {
  const url = await featuresUrl('')
  // Retain legacy auth headers; the BFF adapter and public proxy strip Authorization.
  const res = await fetchGet<Record<string, FeatureFlag> | FeatureFlag[]>(url, Config.authOpts())
  return res.data
}

export async function getFeatureFlag(key: string): Promise<FeatureFlag | undefined> {
  const url = await featuresUrl(`/${encodeURIComponent(key)}`)
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
