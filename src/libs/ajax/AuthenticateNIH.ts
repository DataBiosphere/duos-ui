import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { merge } from 'lodash'
import { DuosUser } from 'src/types/model'

/**
 * ECM has several different providers such as `era-commons`, `ras`, `gitHub`, `fence`, and others.
 * DUOS historically used eRA Commons, but RAS is the new standard.
 */
const provider: string = 'ras'

interface LinkInfo {
  additionalState?: {
    redirectTo?: string
  }
}

export const AuthenticateNIH = {
  deleteAccountLinkage: async (): Promise<void> => {
    const url = `${await Config.getApiUrl()}/api/nih`
    await fetchDelete<void>(url, Config.authOpts())
  },

  getECMProviderAuthUrl: async (
    redirectUri: string,
    redirectTo: string,
  ): Promise<string | URL> => {
    const url = `${await Config.getECMUrl()}/api/oauth/v1/${provider}/authorization-url?redirectUri=${redirectUri}`
    // ECM returns `text/plain` and expects `Accept: */*`
    const authOpts = merge({}, Config.authOpts(), { headers: { Accept: '*/*' } })
    const res = await fetchPost<string | URL>(url, { redirectTo }, authOpts)
    if (res?.data) {
      return res.data
    }
    throw new Error(JSON.stringify(res))
  },

  getECMProviderLinkInfo: async (
    code: string,
    state: string,
  ): Promise<LinkInfo | undefined> => {
    const url = `${await Config.getECMUrl()}/api/oauth/v1/${provider}/oauthcode?state=${state}&oauthcode=${code}`
    const res = await fetchPost<LinkInfo | undefined>(url, null, Config.authOpts())
    return res?.data
  },

  getSyncedUser: async (): Promise<DuosUser> => {
    const url = `${await Config.getApiUrl()}/api/nih/sync`
    const res = await fetchGet<DuosUser>(url, Config.authOpts())
    return res.data
  },
}
