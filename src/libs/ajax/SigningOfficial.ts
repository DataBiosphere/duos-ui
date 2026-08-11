import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface SigningOfficialDashboardSummary {
  researcherStatus: { active: number, inactive: number }
  /**
   * Mirrors the statuses on the SO DAR Requests page: `canceled` is a collection the researcher
   * withdrew, `inProcess` is anything not yet fully approved or canceled.
   */
  darRequests: { total: number, approved: number, canceled: number, inProcess: number }
  darApprovals: { total: number, awaitingSoAction: number }
  dataSubmitters: { approved: number }
  institutionLibrary: { datasets: number, studies: number }
  daaAssociations: { agreements: number, researchersApproved: number }
}

export const SigningOfficial = {
  getDashboardSummary: async (): Promise<SigningOfficialDashboardSummary> => {
    const url = `${await Config.getApiUrl()}/api/signing-official/dashboard-summary`
    const response = await fetchGet<SigningOfficialDashboardSummary>(url, Config.authOpts())
    return response.data
  },
}
