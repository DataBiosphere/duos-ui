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

export const fetchDashboardSummary = async <S>(path: string): Promise<S> => {
  const url = `${await Config.getApiUrl()}${path}`
  const response = await fetchGet<S>(url, Config.authOpts())
  return response.data
}
