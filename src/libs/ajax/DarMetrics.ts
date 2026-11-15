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

/**
 * The reports consent serves for one study or dataset. The others roll decisions up per DAR, whose
 * other datasets can belong to other studies, or aren't about a study's or dataset's DARs at all.
 */
const TARGET_REPORTS: ReadonlySet<string> = new Set([
  'dar-volume',
  'dar-dataset-decisions',
  'dar-dataset-decision-turnaround',
  'dar-expirations',
  'dar-renewals',
])

const getReport = async <T>(path: string, { dacIds, target, ...query }: DarMetricsQuery): Promise<T> => {
  if (target && !TARGET_REPORTS.has(path)) {
    throw new Error(`The ${path} report is not available for one ${target.kind}`)
  }
  // The id goes into the path, and study and dataset ids are whole numbers. Anything else is
  // refused, not encoded: encoding leaves "." and ".." alone, and a URL resolves those away.
  if (target && !/^\d+$/.test(String(target.id))) {
    throw new Error(`Not a ${target.kind} id: ${target.id}`)
  }
  // A study's or dataset's report has no DAC scope and no rows to page, so neither is sent.
  const sent = target
    ? { from: query.from, to: query.to, bucket: query.bucket }
    : { ...query, dacId: dacIds?.length ? dacIds : undefined }
  const params = Object.fromEntries(
    Object.entries(sent).filter(([, value]) => value !== undefined && value !== null),
  ) as Params
  const scope = target ? `/${target.kind}/${target.id}` : ''
  const url = `${await Config.getApiUrl()}/api/metrics/${path}${scope}`
  const res = await fetchGet<T>(url, { ...Config.authOpts(), params })
  return res.data
}

/**
 * DAR reporting for admins, and for DAC chairs and members over their DACs. Every call needs an
 * inclusive `from`/`to` range. With a `target`, the reports in TARGET_REPORTS cover that study or
 * dataset instead: expirations and renewals for whoever can read its DAR history, and the rest,
 * which count denied and pending requests, for admins and the DAC in charge.
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
