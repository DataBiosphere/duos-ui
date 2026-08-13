import {
  DashboardDarRequests,
  fetchDashboardSummary,
} from 'src/libs/ajax/Dashboard'

export interface SigningOfficialDashboardSummary {
  researcherStatus: { active: number, inactive: number }
  /**
   * Mirrors the statuses on the SO DAR Requests page: `canceled` is a collection the researcher
   * withdrew, `inProcess` is anything not yet fully approved or canceled.
   */
  darRequests: DashboardDarRequests
  darApprovals: { total: number, awaitingSoAction: number }
  dataSubmitters: { approved: number }
  institutionLibrary: { datasets: number, studies: number }
  daaAssociations: { agreements: number, researchersApproved: number }
}

export const SigningOfficial = {
  getDashboardSummary: (): Promise<SigningOfficialDashboardSummary> =>
    fetchDashboardSummary('/api/signing-official/dashboard-summary'),
}
