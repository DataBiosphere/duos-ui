export interface FeatureFlag {
  id: string
  value: string
  createDate: number
  updateDate: number
}

/**
 * Whether the BFF session/OAuth flow should be active, per the `BFF_ENABLED`
 * flag served by the consent API (`{DUOS_API_URL}/feature/BFF_ENABLED`).
 * Fails safe to `false` — the legacy client-side auth flow — on any network
 * error, non-2xx response (including 404 when the flag doesn't exist yet),
 * or malformed payload. See the rollout strategy in docs/plans/BFF_Overview.md.
 */
export async function isBffEnabled(apiUrl = process.env.DUOS_API_URL): Promise<boolean> {
  if (!apiUrl) return false
  try {
    const res = await fetch(`${apiUrl}/feature/BFF_ENABLED`)
    if (!res.ok) return false
    const flag = await res.json() as FeatureFlag
    return flag.value === 'true'
  }
  catch {
    return false
  }
}
