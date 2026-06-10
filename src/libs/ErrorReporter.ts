import { Config } from './config'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import { extractError } from 'src/utils/ErrorUtils'
import { Notifications } from 'src/libs/utils'

export const ErrorReporter = {

  report: async (msg: string): Promise<void> => {
    const formattedMsg = await ErrorReporter.format(msg)
    try {
      await Metrics.captureEvent(eventList.errorReport, { error: formattedMsg })
    }
    catch (error) {
      const message = extractError(error)
      Notifications.showError({ text: message })
    }
  },

  format: async (msg: string): Promise<string> => {
    const env = await Config.getEnv()
    return '['.concat(env)
      .concat('] ')
      .concat(msg)
      .concat(' ')
  },

}

export default ErrorReporter
