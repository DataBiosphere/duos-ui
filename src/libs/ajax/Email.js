import { mergeAll } from 'lodash/fp'
import { Config } from '../config'
import { getApiUrl, fetchOk } from '../ajax'

export const Email = {
  sendReminderEmail: async (voteId) => {
    const url = `${await getApiUrl()}/api/emailNotifier/reminderMessage/${voteId}`
    const res = await fetchOk(url, mergeAll([Config.authOpts(), { method: 'POST' }]))
    return res
  },
}
