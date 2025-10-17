import { uniq } from 'lodash/fp'
import { Config } from '../config'
import { getApiUrl } from '../ajax'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const Match = {
  findMatchBatch: async (purposeIdsArr = []) => {
    const purposeIds = uniq(purposeIdsArr).join(',')
    const url = `${await getApiUrl()}/api/match/purpose/batch`
    const config = Object.assign({}, Config.authOpts(), { params: { purposeIds } })
    const res = await fetchGet(url, config)
    return res.data
  },
}
