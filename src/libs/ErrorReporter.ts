import { Config } from './config'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'

export const ErrorReporter = {

  report: async (msg: string): Promise<void> => {
    const formattedMsg = await ErrorReporter.format(msg)
    try {
      await Metrics.captureEvent(eventList.errorReport, { error: formattedMsg })
    }
    catch (_error) {
      // swallow error to avoid user visible errors
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
