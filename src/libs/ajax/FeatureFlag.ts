import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface FeatureFlag {
  id: string
  value: string
  createDate: number
  updateDate: number
}

// BFF NOTE: /feature must stay at the absolute Consent URL post-cutover — it
// is unauthenticated and consulted pre-login (e.g. NHGRI_RESTRICTED_DAC), and
// the session-guarded BFF proxy returns 401 for sessionless requests. Hence
// getUpstreamApiUrl, never the proxied getApiUrl.
export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlag> | FeatureFlag[]> {
  const url = `${await Config.getUpstreamApiUrl()}/feature`
  // authOpts() stays for legacy parity (signed-in legacy users send their
  // token even though /feature doesn't need it); in BFF mode the fetch
  // adapter strips the Authorization header before sending.
  const res = await fetchGet<Record<string, FeatureFlag> | FeatureFlag[]>(url, Config.authOpts())
  return res.data
}

export async function getFeatureFlag(key: string): Promise<FeatureFlag | undefined> {
  const url = `${await Config.getUpstreamApiUrl()}/feature/${encodeURIComponent(key)}`
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
