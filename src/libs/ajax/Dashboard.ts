import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface DashboardDataLibrary {
  studies: number
  datasets: number
  models: number
  workspaces: number
}

export interface DashboardDarRequests {
  total: number
  approved: number
  canceled: number
  inProcess: number
}

/** The last 90 days, over `from` to `to` inclusive. */
export interface DashboardMetrics {
  from: string
  to: string
  decisions: { submitted: number, pending: number, approved: number, denied: number, mixed: number, canceled: number }
  /** Consent omits the statistics when nothing in the window was measured. */
  turnaround: { decided: number, unmeasured: number, medianDays?: number | null, modeDays?: number | null }
  /** Admin dashboard only. */
  soApprovals?: { approved: number, pending: number, skipped: number }
  volume: { dars: number, researchers: number, institutions: number }
  expiration: { expired: number, closedOut: number, renewals: number }
}

export const fetchDashboardSummary = async <S>(path: string): Promise<S> => {
  const url = `${await Config.getApiUrl()}${path}`
  const response = await fetchGet<S>(url, Config.authOpts())
  return response.data
}
