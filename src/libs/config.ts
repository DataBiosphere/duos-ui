import { Storage } from 'src/libs/storage'

interface ConfigType {
  env: string
  apiUrl: string
  bardApiUrl: string
  ecmApiUrl: string
  errorApiKey: string
  gaId: string
  hash: string
  nihUrl: string
  ontologyApiUrl: string
  profileUrl: string
  samApiUrl: string
  tag: string
  tdrApiUrl: string
  terraUrl: string
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

  async getBardApiUrl(): Promise<string> {
    return getBardApiUrl()
  }

  async getEcmApiUrl(): Promise<string> {
    return getEcmApiUrl()
  }

  async getECMUrl(): Promise<string> {
    return getECMUrl()
  }

  async getErrorApiKey(): Promise<string> {
    return getErrorApiKey()
  }

  async getGaId(): Promise<string> {
    return getGaId()
  }

  async getHash(): Promise<string> {
    return getHash()
  }

  async getProject(): Promise<string> {
    return getProject()
  }

  async getSamApiUrl(): Promise<string> {
    return getSamApiUrl()
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

export const getApiUrl = async (): Promise<string> => {
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

export const getErrorApiKey = async (): Promise<string> => {
  const config = await loadConfig()
  return config.errorApiKey
}

export const getGaId = async (): Promise<string> => {
  const config = await loadConfig()
  return config.gaId
}

export const getHash = async (): Promise<string> => {
  const config = await loadConfig()
  return config.hash
}

export const getProject = async (): Promise<string> => {
  const env = await getEnv()
  return `broad-duos-${env}`
}

export const getSamApiUrl = async (): Promise<string> => {
  const config = await loadConfig()
  return config.samApiUrl
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

export const Token = {
  getToken: () => {
    return Storage.getOidcUser()?.id_token
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
