import { mergeAll } from 'lodash/fp'
import { Config } from '../config'
import { fetchOk } from '../ajax'

export const Email = {
  sendReminderEmail: async (voteId) => {
    const url = `${await Config.getApiUrl()}/api/emailNotifier/reminderMessage/${voteId}`
    const res = await fetchOk(url, mergeAll([Config.authOpts(), { method: 'POST' }]))
    return res
  },
}
