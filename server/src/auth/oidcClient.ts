import * as oidc from 'openid-client'

/**
 * Single Azure B2C OIDC client for the BFF OAuth flow.
 *
 * B2C is the only OIDC client the BFF talks to — provider selection (Google vs
 * Microsoft) happens on the B2C-hosted login page, so there is no multi-client
 * factory and no per-provider branching here. The sub-provider is derived from
 * the B2C `id_token`'s `idp` claim at callback time.
 *
 * Discovery is cached for the life of the process: the B2C metadata is fixed
 * per deployment, and every /auth/* request needs it. Failed discovery is NOT
 * cached — a lookup that failed during a network blip rejects per-request and
 * heals on the next call (callers, e.g. index.ts's startup warm-up, decide
 * whether/how to log). index.ts warms this cache at startup so the first
 * login doesn't pay the discovery round-trip.
 */
let oidcConfigPromise: Promise<oidc.Configuration> | null = null

export function getOidcConfig(): Promise<oidc.Configuration> {
  oidcConfigPromise ??= discover().catch((err: unknown) => {
    oidcConfigPromise = null
    throw err
  })
  return oidcConfigPromise
}

async function discover(): Promise<oidc.Configuration> {
  // DUOS_AZURE_ISSUER_URL is the full B2C discovery document URL — it contains
  // `.well-known` and the `?p=<policy>` query string, which tells discovery()
  // to fetch it as-is rather than derive a .well-known path (that would mangle
  // the query string).
  return oidc.discovery(
    new URL(requireEnv('DUOS_AZURE_ISSUER_URL')),
    requireEnv('DUOS_AZURE_CLIENT_ID'),
    requireEnv('DUOS_AZURE_CLIENT_SECRET'),
  )
}

/**
 * Validated here so a misconfigured environment fails with an error naming the
 * env var, instead of a TypeError from `new URL(undefined)` or an opaque B2C
 * rejection at token exchange.
 */
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is unset but is required for the BFF OAuth flow — set it in .env.local locally, or the deployment env in k8s`)
  }
  return value
}

/** PKCE + state helpers for the authorization-code flow (RFC 7636 S256). */
export const pkce = {
  verifier: (): string => oidc.randomPKCECodeVerifier(),
  challenge: (verifier: string): Promise<string> => oidc.calculatePKCECodeChallenge(verifier),
  state: (): string => oidc.randomState(),
}

// Test-only: clear the process-lifetime cache between cases.
export const resetOidcCache = (): void => {
  oidcConfigPromise = null
}
