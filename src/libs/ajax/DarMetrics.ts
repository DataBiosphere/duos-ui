import { Config } from 'src/libs/config'
import { fetchGet, Params } from 'src/libs/ajax/fetchAdapter'
import {
  DarDatasetDecisionReport,
  DarDatasetTurnaroundReport,
  DarDecisionReport,
  DarExpirationReport,
  DarMetricsQuery,
  DarRenewalReport,
  DarSoApprovalReport,
  DarTurnaroundReport,
  DarVolumeReport,
  DatasetReport,
  ElectionReport,
  InstitutionReport,
  StudyReport,
  TermReport,
  UserReport,
} from 'src/types/darMetrics'

const getReport = async <T>(path: string, { dacIds, subject, ...query }: DarMetricsQuery): Promise<T> => {
  // A study or dataset is its own scope, so a DAC scope alongside it would only be ignored.
  const params = Object.fromEntries(
    Object.entries({ ...query, dacId: !subject && dacIds?.length ? dacIds : undefined })
      .filter(([, value]) => value !== undefined && value !== null),
  ) as Params
  const scoped = subject ? `/${subject.type}/${encodeURIComponent(subject.id)}` : ''
  const url = `${await Config.getApiUrl()}/api/metrics/${path}${scoped}`
  const res = await fetchGet<T>(url, { ...Config.authOpts(), params })
  return res.data
}

/**
 * DAR reporting for admins, and for DAC chairs and members over their DACs. Every call needs an
 * inclusive `from`/`to` range. With a `subject`, the volume, decision, turnaround, expiration and
 * renewal reports cover one study or dataset instead, for anyone who may read its DAR history.
 */
export const DarMetrics = {
  getVolume: (query: DarMetricsQuery) => getReport<DarVolumeReport>('dar-volume', query),

  getDecisions: (query: DarMetricsQuery) => getReport<DarDecisionReport>('dar-decisions', query),

  getDatasetDecisions: (query: DarMetricsQuery) =>
    getReport<DarDatasetDecisionReport>('dar-dataset-decisions', query),

  getDecisionTurnaround: (query: DarMetricsQuery) =>
    getReport<DarTurnaroundReport>('dar-decision-turnaround', query),

  getDatasetDecisionTurnaround: (query: DarMetricsQuery) =>
    getReport<DarDatasetTurnaroundReport>('dar-dataset-decision-turnaround', query),

  getSoApprovals: (query: DarMetricsQuery) => getReport<DarSoApprovalReport>('dar-so-approvals', query),

  getExpirations: (query: DarMetricsQuery) => getReport<DarExpirationReport>('dar-expirations', query),

  getRenewals: (query: DarMetricsQuery) => getReport<DarRenewalReport>('dar-renewals', query),

  getUsers: (query: DarMetricsQuery) => getReport<UserReport>('users', query),

  getInstitutions: (query: DarMetricsQuery) => getReport<InstitutionReport>('institutions', query),

  getDatasets: (query: DarMetricsQuery) => getReport<DatasetReport>('datasets', query),

  getStudies: (query: DarMetricsQuery) => getReport<StudyReport>('studies', query),

  getElections: (query: DarMetricsQuery) => getReport<ElectionReport>('elections', query),

  getDarTerms: (query: DarMetricsQuery) => getReport<TermReport>('dar-terms', query),
}
