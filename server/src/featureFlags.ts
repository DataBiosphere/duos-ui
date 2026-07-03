import type { FastifyBaseLogger } from 'fastify'

export interface FeatureFlag {
  id: string
  value: string
  createDate: number
  updateDate: number
}

// Bounded so a hung consent API cannot stall server startup: buildApp() awaits
// this before listen(), and Node's fetch has no default timeout (undici waits
// ~300s for headers), which would fail k8s startup probes long before then.
const FETCH_TIMEOUT_MS = 5000

/**
 * Whether the BFF session/OAuth flow should be active, per the `BFF_ENABLED`
 * flag served by the consent API (`{DUOS_API_URL}/feature/BFF_ENABLED`).
 * Fails safe to `false` — the legacy client-side auth flow — on any network
 * error, timeout, non-2xx response (including 404 when the flag doesn't exist
 * yet), or malformed payload. Each non-enabled outcome is logged so a pod that
 * booted during a consent blip is distinguishable from one where the flag is
 * genuinely off. See the rollout strategy in docs/plans/BFF_Overview.md.
 */
export async function isBffEnabled(log: Pick<FastifyBaseLogger, 'warn'>, apiUrl = process.env.DUOS_API_URL): Promise<boolean> {
  if (!apiUrl) {
    log.warn('[featureFlags] DUOS_API_URL is not set; BFF disabled')
    return false
  }
  try {
    const res = await fetch(`${apiUrl}/feature/BFF_ENABLED`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!res.ok) {
      log.warn(`[featureFlags] BFF_ENABLED lookup returned ${res.status}; BFF disabled`)
      return false
    }
    const flag = await res.json() as FeatureFlag
    return flag.value === 'true'
  }
  catch (err) {
    log.warn({ err }, '[featureFlags] BFF_ENABLED lookup failed; BFF disabled')
    return false
  }
}
