import { Config } from '../config'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'

export const Translate = {
  translate: async (body) => {
    const url = `${await Config.getOntologyUrl()}/translate/paragraph`
    const res = await fetchPost(url, body, Config.authOpts())
    return res.data
  },
}
