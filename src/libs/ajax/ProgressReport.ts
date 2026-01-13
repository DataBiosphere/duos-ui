import { Config } from '../config'
import { fetchMultipart } from 'src/libs/ajax/fetchAdapter'

export const ProgressReport = {
  submitProgressReport: async (progressReport: FormData, parentReferenceId: string) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/progress_report/` + parentReferenceId
    // Assume progressReport is a FormData instance for multipart
    return await fetchMultipart(url, progressReport, Config.multiPartOpts())
  },
}
