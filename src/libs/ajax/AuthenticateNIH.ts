import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
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

/**
 * BFF NOTE: the DUOS-API-bound calls here (deleteAccountLinkage, getSyncedUser)
 * go through the BFF proxy, which attaches the session's access token
 * server-side. The two ECM-bound calls hit a separate upstream the proxy does
 * not cover — with no client-side token they are sent unauthenticated, which
 * ECM will reject until a server-side ECM proxy route exists (a known gap in
 * the Phase 4 plan, flagged for follow-up).
 */
export const AuthenticateNIH = {
  deleteAccountLinkage: async (): Promise<void> => {
    const url = `${await Config.getApiUrl()}/api/nih`
    await fetchDelete<void>(url)
  },

  getECMProviderAuthUrl: async (
    redirectUri: string,
    redirectTo: string,
  ): Promise<string | URL> => {
    const url = `${await Config.getECMUrl()}/api/oauth/v1/${provider}/authorization-url?redirectUri=${redirectUri}`
    // ECM returns `text/plain` and expects `Accept: */*`
    const res = await fetchPost<string | URL>(url, { redirectTo }, { headers: { Accept: '*/*' } })
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
    const res = await fetchPost<LinkInfo | undefined>(url, null)
    return res?.data
  },

  getSyncedUser: async (): Promise<DuosUser> => {
    const url = `${await Config.getApiUrl()}/api/nih/sync`
    const res = await fetchGet<DuosUser>(url)
    return res.data
  },
}
