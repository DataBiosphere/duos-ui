import { Config } from '../config'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'

export const Email = {
  sendReminderEmail: async (voteId) => {
    const url = `${await Config.getApiUrl()}/api/emailNotifier/reminderMessage/${voteId}`
    await fetchPost(url, undefined, Config.authOpts())
  },
}
