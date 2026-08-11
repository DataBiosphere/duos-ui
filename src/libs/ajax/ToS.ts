import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { UserStatusInfo } from 'src/types/model'

export interface ToSStatus {
  acceptedOn: string
  isCurrentVersion: boolean
  latestAcceptedVersion: string
  permitsSystemUsage: boolean
}

export const ToS = {
  /**
   * Fetch the DUOS Terms of Service text.
   */
  getDUOSText: async (): Promise<string> => {
    const url = `${await Config.getApiUrl()}/tos/text/duos`
    const res = await fetchGet<string>(url, Config.textPlain())
    return res.data
  },

  /**
   * Accept the Terms of Service for the current user.
   */
  acceptToS: async (): Promise<UserStatusInfo> => {
    const url = `${await Config.getApiUrl()}/api/sam/register/self/tos`
    const res = await fetchPost<UserStatusInfo>(url, {})
    return res.data
  },

  /**
   * Reject the Terms of Service for the current user.
   * Returns the ToSStatus response.
   */
  rejectToS: async (): Promise<ToSStatus> => {
    const url = `${await Config.getApiUrl()}/api/sam/register/self/tos`
    const res = await fetchDelete<ToSStatus>(url)
    return res.data
  },
}
