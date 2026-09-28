/**
 * Per-test scenarios for the mock OIDC provider and the mock Consent upstream
 * (DT-4069, BFF Epic 6 story 6-D-mock).
 *
 * Playwright runs spec files in parallel against one pair of mock processes, so
 * no control may set a global mode. Each test registers its own scenario under a
 * random key, and the key travels with the flow:
 *
 *   1. The spec intercepts the browser's navigation to `/authorize` and appends
 *      `scenario=<key>`. The BFF's own parameters stay untouched.
 *   2. The provider binds the key to the authorization code, and then embeds it
 *      in the access and refresh tokens that it mints at `/token`.
 *   3. Refresh calls come from the BFF, not the browser, so the provider reads
 *      the key back out of the refresh token.
 *   4. The Consent upstream reads the key out of the Bearer token it receives.
 *
 * The `default` scenario serves a flow that carries no key. It is read-only, so
 * no spec can change what another spec sees.
 */

export const DEFAULT_SCENARIO_KEY = 'default'

/** Letters, digits, `_` and `-` only, so a key never contains the `.` that separates token parts. */
const SCENARIO_KEY_PATTERN = /^[\w-]{1,64}$/

export const isScenarioKey = (value: unknown): value is string =>
  typeof value === 'string' && SCENARIO_KEY_PATTERN.test(value)

/** The Entra issuer that B2C copies into `idp` for a Microsoft sign-in. */
export const MICROSOFT_IDP_CLAIM = 'https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0'

/** What B2C's Google technical profile writes into `idp`. */
export const GOOGLE_IDP_CLAIM = 'google.com'

export const IDP_CHOICES = ['google', 'microsoft', 'omit'] as const
export const REFRESH_BEHAVIORS = ['ok', 'invalid_grant', 'server_error', 'hang'] as const
export const USER_ME_STATUSES = [200, 401, 404, 409] as const

export interface ProviderSettings {
  /** The `idp` claim in the `id_token`: `omit` leaves the claim out. */
  idp: typeof IDP_CHOICES[number]
  /** The `email` claim. `null` leaves the claim out; any string is sent as is. */
  email: string | null
  /** `expires_in` for every access token in the scenario, in seconds. */
  accessTokenLifetimeSeconds: number
  /** False withholds the refresh token, as B2C does without `offline_access`. */
  issueRefreshToken: boolean
  /**
   * The answer to a refresh grant: new tokens, a terminal `invalid_grant`, a
   * transient 503, or no answer at all.
   */
  refresh: typeof REFRESH_BEHAVIORS[number]
  /** An OAuth error code for `/authorize` to send back instead of a code, e.g. `access_denied`. */
  authorizeError: string | null
}

export interface ConsentSettings {
  /** The status that `/api/user/me` answers, per story 2-H's four-branch contract. */
  userMe: typeof USER_ME_STATUSES[number]
  /** The body of a 200 from `/api/user/me`. `null` builds a researcher profile from the `email` claim. */
  profile: Record<string, unknown> | null
}

export interface Scenario {
  provider: ProviderSettings
  consent: ConsentSettings
}

export interface ScenarioUpdate {
  provider?: Partial<ProviderSettings>
  consent?: Partial<ConsentSettings>
}

export interface UpstreamRequest {
  method: string
  path: string
  authorization: string | null
}

/** What happened in a scenario, so a spec can assert on calls the browser never sees. */
export interface ScenarioStats {
  authorizations: number
  codeGrants: number
  refreshGrants: number
  endSessions: number
  upstreamRequests: UpstreamRequest[]
}

export const DEFAULT_EMAIL = 'mock-researcher@example.org'

/** A registered researcher, so a signed-in spec lands in the Researcher Console. */
export const defaultProfile = (email: string | null): Record<string, unknown> => ({
  userId: 900001,
  displayName: 'Mock Researcher',
  email: email ?? DEFAULT_EMAIL,
  emailPreference: false,
  createDate: '2026-01-01T00:00:00.000Z',
  roles: [{ roleId: 5, name: 'Researcher', userId: 900001 }],
})

const PROVIDER_DEFAULTS: Readonly<ProviderSettings> = {
  idp: 'google',
  email: DEFAULT_EMAIL,
  accessTokenLifetimeSeconds: 3600,
  issueRefreshToken: true,
  refresh: 'ok',
  authorizeError: null,
}

const CONSENT_DEFAULTS: Readonly<ConsentSettings> = {
  userMe: 200,
  profile: null,
}

const defaultScenario = (): Scenario => ({ provider: { ...PROVIDER_DEFAULTS }, consent: { ...CONSENT_DEFAULTS } })

const emptyStats = (): ScenarioStats => ({
  authorizations: 0,
  codeGrants: 0,
  refreshGrants: 0,
  endSessions: 0,
  upstreamRequests: [],
})

/** Thrown for a bad control request. The control API answers it with a 400. */
export class ScenarioError extends Error {}

const oneOf = <T>(allowed: readonly T[], value: unknown, name: string): T => {
  if (!allowed.includes(value as T)) {
    throw new ScenarioError(`${name} must be one of ${allowed.join(', ')}`)
  }
  return value as T
}

const check = (valid: boolean, message: string): void => {
  if (!valid) throw new ScenarioError(message)
}

/** Rejects a misspelled or mistyped control, so a spec cannot pass by testing the defaults. */
function validateProvider(patch: Partial<ProviderSettings>): void {
  for (const key of Object.keys(patch)) {
    check(key in PROVIDER_DEFAULTS, `unknown provider setting '${key}'`)
  }
  if ('idp' in patch) oneOf(IDP_CHOICES, patch.idp, 'provider.idp')
  if ('refresh' in patch) oneOf(REFRESH_BEHAVIORS, patch.refresh, 'provider.refresh')
  if ('email' in patch) check(patch.email === null || typeof patch.email === 'string', 'provider.email must be a string or null')
  if ('authorizeError' in patch) {
    check(patch.authorizeError === null || isScenarioKey(patch.authorizeError), 'provider.authorizeError must be an OAuth error code or null')
  }
  if ('issueRefreshToken' in patch) check(typeof patch.issueRefreshToken === 'boolean', 'provider.issueRefreshToken must be a boolean')
  if ('accessTokenLifetimeSeconds' in patch) {
    const lifetime = patch.accessTokenLifetimeSeconds
    check(Number.isSafeInteger(lifetime) && (lifetime ?? 0) > 0, 'provider.accessTokenLifetimeSeconds must be a positive integer')
  }
}

function validateConsent(patch: Partial<ConsentSettings>): void {
  for (const key of Object.keys(patch)) {
    check(key in CONSENT_DEFAULTS, `unknown consent setting '${key}'`)
  }
  if ('userMe' in patch) oneOf(USER_ME_STATUSES, patch.userMe, 'consent.userMe')
  if ('profile' in patch) check(typeof patch.profile === 'object', 'consent.profile must be an object or null')
}

export class ScenarioStore {
  private readonly scenarios = new Map<string, { scenario: Scenario, stats: ScenarioStats }>([
    [DEFAULT_SCENARIO_KEY, { scenario: defaultScenario(), stats: emptyStats() }],
  ])

  has(key: string): boolean {
    return this.scenarios.has(key)
  }

  get(key: string): Scenario | undefined {
    return this.scenarios.get(key)?.scenario
  }

  stats(key: string): ScenarioStats | undefined {
    return this.scenarios.get(key)?.stats
  }

  /**
   * Creates the scenario from the defaults, or merges into the one that exists.
   * A spec can change a scenario during its test, e.g. to let the provider
   * recover after a failed refresh. Stats are kept across updates.
   */
  update(key: string, patch: ScenarioUpdate): Scenario {
    check(key !== DEFAULT_SCENARIO_KEY, `the '${DEFAULT_SCENARIO_KEY}' scenario is shared and read-only; register a key of your own`)
    check(isScenarioKey(key), 'a scenario key must be 1-64 letters, digits, _ or -')
    const provider = patch.provider ?? {}
    const consent = patch.consent ?? {}
    validateProvider(provider)
    validateConsent(consent)

    const entry = this.scenarios.get(key) ?? { scenario: defaultScenario(), stats: emptyStats() }
    entry.scenario = {
      provider: { ...entry.scenario.provider, ...provider },
      consent: { ...entry.scenario.consent, ...consent },
    }
    this.scenarios.set(key, entry)
    return entry.scenario
  }

  delete(key: string): boolean {
    return key !== DEFAULT_SCENARIO_KEY && this.scenarios.delete(key)
  }
}

/**
 * Token formats. The key is the second part, so each mock reads the scenario
 * back out of a token without shared state beyond the store.
 */
export const ACCESS_TOKEN_PREFIX = 'mock'
export const REFRESH_TOKEN_PREFIX = 'mockrt'

export const mintToken = (prefix: string, key: string, random: string): string => `${prefix}.${key}.${random}`

export function scenarioKeyFromToken(token: string, prefix: string): string | undefined {
  const [tokenPrefix, key, random, ...rest] = token.split('.')
  if (tokenPrefix !== prefix || !isScenarioKey(key) || !random || rest.length > 0) return undefined
  return key
}
