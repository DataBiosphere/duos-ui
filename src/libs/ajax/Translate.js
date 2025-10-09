import { Config } from '../config'
import { getOntologyUrl } from '../ajax'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'

export const Translate = {
  translate: async (body) => {
    const url = `${await getOntologyUrl()}/translate/paragraph`
    const res = await fetchPost(url, body, Config.authOpts())
    return res.data
  },
}
