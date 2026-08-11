import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface ResearcherDashboardSummary {
  /** What this researcher can see in the Data Library, by asset tab. */
  dataLibrary: { studies: number, datasets: number, models: number, workspaces: number }
  /**
   * Mirrors the DAR Requests page: `canceled` is a collection the researcher withdrew, `inProcess`
   * is anything not yet fully approved or canceled. No denied count - the system records none.
   * Drafts are excluded.
   */
  darRequests: { total: number, approved: number, canceled: number, inProcess: number }
  /** `expiringSoon` is the subset of `active` expiring within 30 days. */
  datasetApprovals: { active: number, expiringSoon: number, expired: number }
  /** Sum of the nine My Data Submissions tab counts. */
  dataSubmissions: { total: number }
}

export const Researcher = {
  getDashboardSummary: async (): Promise<ResearcherDashboardSummary> => {
    const url = `${await Config.getApiUrl()}/api/researcher/dashboard-summary`
    const response = await fetchGet<ResearcherDashboardSummary>(url, Config.authOpts())
    return response.data
  },
}
