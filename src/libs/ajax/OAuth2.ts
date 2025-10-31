import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface OAuthConfig {
  clientId: string
  authorityEndpoint: string
}

export const OAuth2 = {
  getConfig: async (): Promise<OAuthConfig> => getConfig(),
}

const getConfig = async (): Promise<OAuthConfig> => {
  const configUrl = `${await Config.getApiUrl()}/oauth2/configuration`
  const res = await fetchGet(configUrl)
  return res.data
}
