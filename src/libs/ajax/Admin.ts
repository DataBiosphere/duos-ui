import { DashboardDarRequests, DashboardMetrics, fetchDashboardSummary } from 'src/libs/ajax/Dashboard'

export interface AdminDashboardSummary {
  darRequests: DashboardDarRequests
  dacs: { total: number }
  users: { total: number }
  institutions: { total: number, withoutSigningOfficial: number }
  libraryCards: { total: number }
  daaAssociations: { agreements: number, researchersApproved: number }
  metrics: Required<DashboardMetrics>
}

export const Admin = {
  getDashboardSummary: (): Promise<AdminDashboardSummary> =>
    fetchDashboardSummary('/api/admin/dashboard-summary'),
}
