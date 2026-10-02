import { DashboardDarRequests, fetchDashboardSummary } from 'src/libs/ajax/Dashboard'

export interface AdminDashboardSummary {
  darRequests: DashboardDarRequests
  dacs: { total: number }
  users: { total: number }
  institutions: { total: number, withoutSigningOfficial: number }
  libraryCards: { total: number }
  daaAssociations: { agreements: number, researchersApproved: number }
  /** The last 90 days, over `from` to `to` inclusive. */
  metrics: {
    from: string
    to: string
    decisions: { submitted: number, pending: number, approved: number, denied: number, mixed: number, canceled: number }
    /** Consent omits the statistics when nothing in the window was measured. */
    turnaround: { decided: number, unmeasured: number, medianDays?: number | null, modeDays?: number | null }
    soApprovals: { approved: number, pending: number, skipped: number }
    volume: { dars: number, researchers: number, institutions: number }
    expiration: { expired: number, closedOut: number, renewals: number }
  }
}

export const Admin = {
  getDashboardSummary: (): Promise<AdminDashboardSummary> =>
    fetchDashboardSummary('/api/admin/dashboard-summary'),
}
