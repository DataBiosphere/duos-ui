import {
  DashboardDarRequests,
  DashboardDataLibrary,
  fetchDashboardSummary,
} from 'src/libs/ajax/Dashboard'

export interface ResearcherDashboardSummary {
  /** What this researcher can see in the Data Library, by asset tab. */
  dataLibrary: DashboardDataLibrary
  /**
   * Mirrors the DAR Requests page: `canceled` is a collection the researcher withdrew, `inProcess`
   * is anything not yet fully approved or canceled. No denied count - the system records none.
   * Drafts are excluded.
   */
  darRequests: DashboardDarRequests
  /** `expiringSoon` is the subset of `active` expiring within 30 days. */
  datasetApprovals: { active: number, expiringSoon: number, expired: number }
  /** Sum of the nine My Data Submissions tab counts. */
  dataSubmissions: { total: number }
}

export const Researcher = {
  getDashboardSummary: (): Promise<ResearcherDashboardSummary> =>
    fetchDashboardSummary('/api/researcher/dashboard-summary'),
}
