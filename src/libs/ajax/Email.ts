import { Config } from '../config'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'

export const Email = {
  /**
   * Send a reminder email for a specific vote.
   * @param voteId The ID of the vote to send a reminder for
   * @returns Promise that resolves when the email is sent
   */
  sendReminderEmail: async (voteId: number): Promise<void> => {
    const url = `${await Config.getApiUrl()}/api/emailNotifier/reminderMessage/${voteId}`
    await fetchPost<void>(url, undefined)
  },
}
