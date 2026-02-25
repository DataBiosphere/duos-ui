import { Config } from '../config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'

export const ToS = {
  getDUOSText: async () => {
    const url = `${await Config.getApiUrl()}/tos/text/duos`
    const res = await fetchGet(url, Config.textPlain())
    return res.data
  },
  acceptToS: async () => {
    const url = `${await Config.getApiUrl()}/api/sam/register/self/tos`
    const res = await fetchPost(url, {}, Config.authOpts())
    return res.data
  },
  rejectToS: async () => {
    const url = `${await Config.getApiUrl()}/api/sam/register/self/tos`
    const res = await fetchDelete(url, Config.authOpts())
    return res.data
  },
}
