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

/**
 * The BFF-side proxy prefix. Must match PROXY_PREFIX in
 * server/src/proxy/apiProxy.ts — it is the public API surface between client
 * and BFF: `/duos-api/api/dataset/1` is forwarded to
 * `${DUOS_API_URL}/api/dataset/1` with the session's access token attached
 * server-side. Changing it means changing both ends together.
 */
const BFF_PROXY_PREFIX = '/duos-api'

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

  async getConsentApiUrl(): Promise<string> {
    return getConsentApiUrl()
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

  async isBffEnabled(): Promise<boolean> {
    return isBffEnabled()
  }

  jsonBody(body: unknown) {
    return jsonBody(body)
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
 * Whether this environment has cut over to the BFF. The server registers the
 * /auth/* routes and the API proxy from the same config.json key, so both
 * sides agree by construction.
 */
export const isBffEnabled = async (): Promise<boolean> => {
  const config = await loadConfig()
  return config.bffEnabled === true
}

/**
 * The base URL for DUOS API calls. In a BFF environment this is the
 * same-origin proxy prefix — requests are relative, carry the session cookie,
 * and the BFF attaches the access token server-side. In a legacy environment
 * it is the absolute Consent URL from config.json.
 */
export const getApiUrl = async (): Promise<string> => {
  return (await isBffEnabled()) ? BFF_PROXY_PREFIX : getConsentApiUrl()
}

/**
 * The absolute Consent URL, regardless of BFF cutover. Only for calls that
 * must not go through the BFF proxy: the unauthenticated `/feature` endpoint
 * is consulted pre-login, and the proxy returns 401 for sessionless requests.
 */
export const getConsentApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.apiUrl
}

export const getBardApiUrl = async (): Promise<string> => { // Mixpanel
  const config = await loadConfig()
  return config.bardApiUrl
}

export const getEcmApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.ecmApiUrl
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

export const getTdrApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.tdrApiUrl
}

export const getTerraUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.terraUrl
}

export const jsonBody = (body: unknown) => ({
  body: JSON.stringify(body),
  headers: { 'Content-Type': 'application/json' },
})

export const textPlain = () => ({
  headers: {
    'Accept': 'text/plain',
    'X-App-ID': 'DUOS',
  },
})
