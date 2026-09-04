import { BFF_PUBLIC_FEATURES_PREFIX, Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface FeatureFlag {
  id: string
  value: string
  createDate: number
  updateDate: number
}

// BFF NOTE: /feature is unauthenticated and consulted pre-login (e.g.
// NHGRI_RESTRICTED_DAC), so it cannot ride the session-guarded /duos-api proxy,
// which 401s a sessionless request. Until story 5-F6 that meant staying on the
// absolute Consent URL and keeping `apiUrl` in the BFF `connect-src` allowlist.
// It now has a dedicated public endpoint instead — same upstream path, no
// session read, no token injected — so under bffEnabled these calls are
// same-origin and the allowlist entry is gone. Legacy keeps getUpstreamApiUrl,
// never the proxied getApiUrl.
//
// Note for anyone changing this: nothing in src/ calls either function today
// (only the unit tests do), so the app cannot be exercised to check the
// endpoint. test/libs/ajax/FeatureFlag.spec.ts and
// server/test/publicProxy.test.ts are the only proof this pair lines up.
const featuresUrl = async (path: string): Promise<string> => {
  if (await Config.isBffEnabled()) {
    return `${BFF_PUBLIC_FEATURES_PREFIX}${path}`
  }
  return `${await Config.getUpstreamApiUrl()}/feature${path}`
}

export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlag> | FeatureFlag[]> {
  const url = await featuresUrl('')
  // authOpts() stays for legacy parity (signed-in legacy users send their
  // token even though /feature doesn't need it); in BFF mode the fetch
  // adapter strips the Authorization header before sending, and the endpoint
  // drops anything that survived that before forwarding.
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
