import { Storage } from 'src/libs/storage'

interface ConfigType {
  env: string
  apiUrl: string
  bardApiUrl: string
  ecmApiUrl: string
  hash: string
  tag: string
  tdrApiUrl: string
  terraUrl: string
  bffEnabled?: boolean
}

let configPromise: Promise<ConfigType> | null = null

const loadConfig = async (): Promise<ConfigType> => {
  if (!configPromise) {
    configPromise = fetch('/config.json').then(res => res.json())
  }
  return configPromise
}

class ConfigClass {
  async getConfig(): Promise<ConfigType> {
    return loadConfig()
  }

  async getEnv(): Promise<string> {
    return getEnv()
  }

  async getApiUrl(): Promise<string> {
    return getApiUrl()
  }

  async getUpstreamApiUrl(): Promise<string> {
    return getUpstreamApiUrl()
  }

  async getBardApiUrl(): Promise<string> {
    return getBardApiUrl()
  }

  async getEcmApiUrl(): Promise<string> {
    return getEcmApiUrl()
  }

  async getECMUrl(): Promise<string> {
    return getECMUrl()
  }

  async getHash(): Promise<string> {
    return getHash()
  }

  async isBffEnabled(): Promise<boolean> {
    return isBffEnabled()
  }

  async getProject(): Promise<string> {
    return getProject()
  }

  async getTag(): Promise<string> {
    return getTag()
  }

  async getTdrApiUrl(): Promise<string> {
    return getTdrApiUrl()
  }

  async getTerraUrl(): Promise<string> {
    return getTerraUrl()
  }

  authOpts(token: string | undefined = Token.getToken()) {
    return authOpts(token)
  }

  jsonBody(body: unknown) {
    return jsonBody(body)
  }

  multiPartOpts(token: string | undefined = Token.getToken()) {
    return multiPartOpts(token)
  }

  textPlain() {
    return textPlain()
  }
}

export const Config = new ConfigClass()

export const getEnv = async (): Promise<string> => {
  const config = await loadConfig()
  return config.env
}

/**
 * The same-origin base paths of the BFF proxies. Each must match the prefix
 * the server registers in server/src/proxy/. BFF_BARD_PREFIX is exported for
 * Metrics.ts, which routes only its *identified* calls through the proxy —
 * anonymous events stay on the direct Bard URL, so getBardApiUrl() is not
 * gated the way the other upstream getters are.
 */
const BFF_API_PREFIX = '/duos-api'
const BFF_ECM_PREFIX = '/ecm-api'
const BFF_TDR_PREFIX = '/tdr-api'
export const BFF_BARD_PREFIX = '/bard-api'

/**
 * The public BFF endpoints (story 5-F6), which are a different thing from the
 * prefixes above: those proxies attach the session's token and 401 without a
 * session, while these two carry no credentials in either direction and are
 * reachable pre-login. They exist so the two remaining direct browser
 * connections become same-origin, which is what lets BFF-mode `connect-src`
 * drop the Consent and Bard origins (server/src/security/csp.ts).
 *
 * Each must match the path server/src/proxy/publicProxy.ts registers.
 */
export const BFF_PUBLIC_FEATURES_PREFIX = '/public/features'
export const BFF_PUBLIC_METRICS_PREFIX = '/public/metrics'

/**
 * Base URL for DUOS API calls.
 */
export const getApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.bffEnabled === true ? BFF_API_PREFIX : config.apiUrl
}

/**
 * The un-proxied Consent API base URL, regardless of the BFF cutover.
 */
export const getUpstreamApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.apiUrl
}

export const getBardApiUrl = async (): Promise<string> => { // Mixpanel
  const config = await loadConfig()
  return config.bardApiUrl
}

// Post-cutover, ECM calls ride the session-authenticated BFF proxy: the
// browser no longer holds the bearer token ECM requires (Epic 3, story 3-I).
export const getEcmApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.bffEnabled === true ? BFF_ECM_PREFIX : config.ecmApiUrl
}

export const getECMUrl = async (): Promise<string> => {
  return await getEcmApiUrl()
}

export const getHash = async (): Promise<string> => {
  const config = await loadConfig()
  return config.hash
}

export const isBffEnabled = async (): Promise<boolean> => {
  const config = await loadConfig()
  return config.bffEnabled === true
}

export const getProject = async (): Promise<string> => {
  const env = await getEnv()
  return `broad-duos-${env}`
}

export const getTag = async (): Promise<string> => {
  const config = await loadConfig()
  return config.tag
}

// Same as getEcmApiUrl: TDR snapshot enumeration authenticates with the
// user's token, attached server-side by the proxy post-cutover (story 3-J).
export const getTdrApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.bffEnabled === true ? BFF_TDR_PREFIX : config.tdrApiUrl
}

export const getTerraUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.terraUrl
}

export const Token = {
  // Note that there are multiple tokens available in OidcUser. There is an encoded JWT stored in id_token,
  // access_token, and refresh_token. There is also a Google OAuth2 access token stored in profile.idp_access_token
  // Favor the idp_access_token which bypasses all AzureB2C error cases and fall back to the regular id_token if the
  // Google token is not present.
  getToken: () => {
    return Storage.getOidcUser()?.profile?.idp_access_token || Storage.getOidcUser()?.id_token
  },
}

export const authOpts = (token: string | undefined = Token.getToken()) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  },
})

export const jsonBody = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
})

export const multiPartOpts = (token: string | undefined = Token.getToken()) => ({
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data',
    'X-App-ID': 'DUOS',
  },
})

export const textPlain = () => ({
  headers: {
    'Accept': 'text/plain',
    'X-App-ID': 'DUOS',
  },
})
