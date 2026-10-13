import { createHash } from 'node:crypto'
import { randomToken } from './jwt'

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
 *   2. The provider binds the key to the authorization code, and then to the
 *      access and refresh tokens that it mints at `/token`.
 *   3. Refresh calls come from the BFF, not the browser, so the provider looks
 *      the scenario up from the refresh token.
 *   4. The Consent upstream looks the scenario up from the Bearer token it receives.
 *
 * The store records every token it issues, so a token is valid only while it is
 * unexpired, unrevoked, and its scenario exists — never because of its shape.
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

/** The `sub` claim for an email. The provider fixes it at sign-in, as B2C does. */
export const subjectFor = (email: string | null): string =>
  createHash('sha256').update(email ?? DEFAULT_EMAIL).digest('hex').slice(0, 32)

/**
 * A registered researcher who accepted the terms of service, so a signed-in spec
 * lands in the Researcher Console. Real Consent always sends `userStatusInfo`,
 * and without `tosAccepted` the client sends the user to /tos_acceptance.
 */
export const defaultProfile = (email: string | null): Record<string, unknown> => ({
  userId: 900001,
  displayName: 'Mock Researcher',
  email: email ?? DEFAULT_EMAIL,
  emailPreference: false,
  createDate: '2026-01-01T00:00:00.000Z',
  roles: [{ roleId: 5, name: 'Researcher', userId: 900001 }],
  userStatusInfo: {
    userEmail: email ?? DEFAULT_EMAIL,
    userSubjectId: subjectFor(email),
    enabled: true,
    adminEnabled: true,
    tosAccepted: true,
  },
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

/** A JSON object: not null and not an array, which `typeof` alone lets through. */
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const UPDATE_SECTIONS = ['provider', 'consent'] as const

/** Rejects a misspelled or non-object section, which would otherwise leave the defaults in force. */
function validateSections(patch: unknown): asserts patch is ScenarioUpdate {
  if (!isPlainObject(patch)) throw new ScenarioError('a scenario update must be a JSON object')
  for (const key of Object.keys(patch)) {
    check((UPDATE_SECTIONS as readonly string[]).includes(key), `unknown scenario section '${key}'; use ${UPDATE_SECTIONS.join(' or ')}`)
  }
  for (const section of UPDATE_SECTIONS) {
    if (Object.hasOwn(patch, section)) check(isPlainObject(patch[section]), `${section} must be an object`)
  }
}

/** Rejects a misspelled or mistyped control, so a spec cannot pass by testing the defaults. */
function validateProvider(patch: Partial<ProviderSettings>): void {
  for (const key of Object.keys(patch)) {
    // Own properties only: `in` would also accept toString, constructor and __proto__.
    check(Object.hasOwn(PROVIDER_DEFAULTS, key), `unknown provider setting '${key}'`)
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
    check(Object.hasOwn(CONSENT_DEFAULTS, key), `unknown consent setting '${key}'`)
  }
  if ('userMe' in patch) oneOf(USER_ME_STATUSES, patch.userMe, 'consent.userMe')
  if ('profile' in patch) check(patch.profile === null || isPlainObject(patch.profile), 'consent.profile must be an object or null')
}

interface ScenarioEntry {
  scenario: Scenario
  stats: ScenarioStats
}

const newEntry = (): ScenarioEntry => ({ scenario: defaultScenario(), stats: emptyStats() })

/**
 * Token formats. The key is the second part only so that a token is easy to read
 * in a log or an assertion; the store, not the shape, decides whether it is valid.
 */
export const ACCESS_TOKEN_PREFIX = 'mock'
export const REFRESH_TOKEN_PREFIX = 'mockrt'

export type TokenKind = 'access' | 'refresh'

export interface IssuedToken {
  kind: TokenKind
  key: string
  /** The scope granted at sign-in, carried through every refresh. */
  scope: string
  /** Fixed at sign-in: a later change to the scenario's email does not alter it. */
  subject: string
  /** Epoch milliseconds. Refresh tokens do not expire within a run. */
  expiresAt: number
}

export class ScenarioStore {
  private readonly scenarios = new Map<string, ScenarioEntry>([[DEFAULT_SCENARIO_KEY, newEntry()]])
  private readonly tokens = new Map<string, IssuedToken>()

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
  update(key: string, patch: unknown): Scenario {
    check(key !== DEFAULT_SCENARIO_KEY, `the '${DEFAULT_SCENARIO_KEY}' scenario is shared and read-only; register a key of your own`)
    check(isScenarioKey(key), 'a scenario key must be 1-64 letters, digits, _ or -')
    validateSections(patch)
    const provider = patch.provider ?? {}
    const consent = patch.consent ?? {}
    validateProvider(provider)
    validateConsent(consent)

    const entry = this.scenarios.get(key) ?? newEntry()
    entry.scenario = {
      provider: { ...entry.scenario.provider, ...provider },
      consent: { ...entry.scenario.consent, ...consent },
    }
    this.scenarios.set(key, entry)
    return entry.scenario
  }

  /**
   * Removes the scenario and revokes its tokens, so a key registered again later
   * starts clean. False when the key is unknown.
   */
  delete(key: string): boolean {
    check(key !== DEFAULT_SCENARIO_KEY, `the '${DEFAULT_SCENARIO_KEY}' scenario is shared and cannot be deleted`)
    if (!this.scenarios.delete(key)) return false
    for (const [token, record] of this.tokens) {
      if (record.key === key) this.tokens.delete(token)
    }
    return true
  }

  /** Mints and records a token. Expired tokens are pruned first, so the map stays small. */
  issueToken(kind: TokenKind, record: Omit<IssuedToken, 'kind'>): string {
    this.pruneExpiredTokens()
    const token = mintToken(kind === 'access' ? ACCESS_TOKEN_PREFIX : REFRESH_TOKEN_PREFIX, record.key, randomToken())
    this.tokens.set(token, { kind, ...record })
    return token
  }

  /**
   * The record of a live token of this kind, or undefined when the store never
   * issued it, revoked it, it expired, or its scenario is gone. `mock.<key>.x`
   * from a browser is therefore rejected, as real Consent rejects a forged token.
   */
  lookupToken(token: string, kind: TokenKind): IssuedToken | undefined {
    const record = this.tokens.get(token)
    if (record?.kind !== kind || !this.scenarios.has(record.key)) return undefined
    if (record.expiresAt <= Date.now()) {
      this.tokens.delete(token)
      return undefined
    }
    return record
  }

  revokeToken(token: string): void {
    this.tokens.delete(token)
  }

  private pruneExpiredTokens(): void {
    const now = Date.now()
    for (const [token, record] of this.tokens) {
      if (record.expiresAt <= now) this.tokens.delete(token)
    }
  }
}

const mintToken = (prefix: string, key: string, random: string): string => `${prefix}.${key}.${random}`
