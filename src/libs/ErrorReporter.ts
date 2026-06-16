import { Config } from './config'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'

export const ErrorReporter = {

  report: async (msg: string): Promise<void> => {
    const formattedMsg = await ErrorReporter.format(msg)
    // Best-effort telemetry: a failure to report must never surface to the user.
    await Metrics.captureEvent(eventList.errorReport, { error: formattedMsg }).catch(() => {})
  },

  format: async (msg: string): Promise<string> => {
    const env = await Config.getEnv()
    return '['.concat(env)
      .concat('] ')
      .concat(msg)
      .concat(' ')
  },

}
