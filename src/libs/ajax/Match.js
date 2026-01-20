import { uniq } from 'lodash/fp'
import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const Match = {
  findMatchBatch: async (purposeIdsArr = []) => {
    const purposeIds = uniq(purposeIdsArr).join(',')
    const url = `${await Config.getApiUrl()}/api/match/purpose/batch`
    const config = Object.assign({}, Config.authOpts(), { params: { purposeIds } })
    const res = await fetchGet(url, config)
    return res.data
  },
}
