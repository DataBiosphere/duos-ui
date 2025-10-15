import { Config } from 'src/libs/config'
import { getECMUrl, getApiUrl } from 'src/libs/ajax'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { merge } from 'lodash'

/**
 * ECM has several different providers such as `era-commons`, `ras`, `gitHub`, `fence`, and others. DUOS has
 * historically used eRA Commons, but RAS is the new standard that Terra will be using. DUOS is moving in that direction
 * and will update as it is released to higher environments.
 * @type {string}
 */
const provider = 'ras'

export const AuthenticateNIH = {

  deleteAccountLinkage: async () => {
    const url = `${await getApiUrl()}/api/nih`
    return await fetchDelete(url, Config.authOpts())
  },

  getECMProviderAuthUrl: async (redirectUri, redirectTo) => {
    const url = `${await getECMUrl()}/api/oauth/v1/${provider}/authorization-url?redirectUri=${redirectUri}`
    // ECM returns a `text/plain` response and expects an `Accept: */*` request header
    const authOpts = merge(Config.authOpts(), { headers: { Accept: '*/*' } })
    const res = await fetchPost(url, { redirectTo: redirectTo }, authOpts)
    if (res?.data) {
      return res.data
    }
    return new Error(res)
  },

  getECMProviderLinkInfo: async (code, state) => {
    const url = `${await getECMUrl()}/api/oauth/v1/${provider}/oauthcode?state=${state}&oauthcode=${code}`
    const res = await fetchPost(url, null, Config.authOpts())
    if (res?.data) {
      return res.data
    }
    return undefined
  },

  getSyncedUser: async () => {
    const url = `${await getApiUrl()}/api/nih/sync`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
}
