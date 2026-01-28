import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

type FeatureFlagValue = string

export async function getAllFeatureFlags(): Promise<Record<string, FeatureFlagValue> | FeatureFlagValue[]> {
  const url = `${await Config.getApiUrl()}/api/featureFlags`
  const res = await fetchGet<Record<string, FeatureFlagValue> | FeatureFlagValue[]>(url, Config.authOpts())
  return res.data
}

export async function getFeatureFlag(key: string): Promise<FeatureFlagValue | undefined> {
  const url = `${await Config.getApiUrl()}/api/featureFlags/${encodeURIComponent(key)}`
  try {
    const res = await fetchGet<FeatureFlagValue>(url, Config.authOpts())
    return res.data
  }
  catch {
    return undefined
  }
}
