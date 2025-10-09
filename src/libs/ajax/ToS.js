import { Config } from '../config'
import { getApiUrl } from '../ajax'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'

export const ToS = {
  getDUOSText: async () => {
    const url = `${await getApiUrl()}/tos/text/duos`
    const res = await fetchGet(url, Config.textPlain())
    return res.data
  },
  /**
   * Returns a json structure of various statuses for an authenticated user.
   * See https://consent.dsde-prod.broadinstitute.org/#/Sam/get_api_sam_register_self_diagnostics
   * for more info.
   * {
   *   'adminEnabled': false,
   *   'enabled': false,
   *   'inAllUsersGroup': true,
   *   'inGoogleProxyGroup': false,
   *   'tosAccepted': true
   * }
   * @returns {Promise<any>}
   */
  getStatus: async () => {
    const url = `${await getApiUrl()}/api/sam/register/self/diagnostics`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
  acceptToS: async () => {
    const url = `${await getApiUrl()}/api/sam/register/self/tos`
    const res = await fetchPost(url, {}, Config.authOpts())
    return res.data
  },
  rejectToS: async () => {
    const url = `${await getApiUrl()}/api/sam/register/self/tos`
    const res = await fetchDelete(url, Config.authOpts())
    return res.data
  },
}
