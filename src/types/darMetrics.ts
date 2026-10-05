// Admin DAR reporting responses from consent's /api/metrics/dar-* endpoints. Timestamps are epoch
// millis; consent omits null fields, so every nullable field is also optional.

export type MetricsBucket = 'day' | 'week' | 'month' | 'quarter'

export interface DarMetricsQuery {
  /** Inclusive, as yyyy-MM-dd. */
  from: string
  /** Inclusive, as yyyy-MM-dd. */
  to: string
  bucket?: MetricsBucket
  limit?: number
  offset?: number
  /** Limits the report to these DACs' datasets; omitted, consent picks the caller's default scope. */
  dacIds?: number[]
}

export interface DarMetricsReport<B, R> {
  from: string
  to: string
  bucket: Uppercase<MetricsBucket>
  /** Across every page, not just `rows`. */
  total: number
  /** The whole range; only `rows` is paginated. */
  buckets: B[]
  rows: R[]
}

export type InstitutionSource = 'RECORDED' | 'CURRENT'

export interface VolumeBucketCount {
  bucketStart: number
  darCount: number
  researcherCount: number
  institutionCount: number
  datasetCount: number
}

export interface InstitutionDarCount {
  institutionId?: number | null
  institutionName?: string | null
  darCount: number
  researcherCount: number
}

export interface ResearcherDarCount {
  userId: number
  darCount: number
}

export interface DarVolume {
  referenceId: string
  collectionId: number
  userId: number
  submissionDate: number
  institutionId?: number | null
  institutionName?: string | null
  institutionSource: InstitutionSource
  datasetCount: number
  labStaffCount: number
  internalCollaboratorCount: number
}

export interface DarVolumeReport extends DarMetricsReport<VolumeBucketCount, DarVolume> {
  institutions: InstitutionDarCount[]
  researchers: ResearcherDarCount[]
}

export type DecisionState = 'APPROVED' | 'DENIED' | 'MIXED' | 'PENDING' | 'CANCELED' | 'NO_ELECTION'
export type DarDecisionState = Exclude<DecisionState, 'NO_ELECTION'>
export type DatasetDecisionState = Exclude<DecisionState, 'MIXED'>

export type DecidedVia = 'MANUAL' | 'RADAR' | 'MIXED'
export type DatasetDecidedVia = Exclude<DecidedVia, 'MIXED'>

export interface DecisionBucketCount<S extends DecisionState = DecisionState, V extends DecidedVia = DecidedVia> {
  bucketStart: number
  state: S
  decidedVia?: V | null
  count: number
}

export interface DarDecision {
  referenceId: string
  collectionId: number
  submissionDate: number
  datasetCount: number
  state: DarDecisionState
  decidedVia?: DecidedVia | null
  decisionDate?: number | null
}

export interface DarDatasetDecision {
  referenceId: string
  collectionId: number
  submissionDate: number
  datasetId: number
  state: DatasetDecisionState
  decidedVia?: DatasetDecidedVia | null
  decisionDate?: number | null
}

export type DarDecisionReport = DarMetricsReport<DecisionBucketCount<DarDecisionState>, DarDecision>
type DatasetDecisionBucketCount = DecisionBucketCount<DatasetDecisionState, DatasetDecidedVia>
export type DarDatasetDecisionReport = DarMetricsReport<DatasetDecisionBucketCount, DarDatasetDecision>

export interface TurnaroundBucket {
  bucketStart: number
  count: number
  unmeasured: number
  meanDays?: number | null
  medianDays?: number | null
  /** Whole days, smallest on a tie. */
  modeDays?: number | null
}

export interface DarTurnaround {
  referenceId: string
  collectionId: number
  submissionDate: number
  decisionDate: number
  decidedVia: DecidedVia
  elapsedDays: number
}

export interface DarDatasetTurnaround extends Omit<DarTurnaround, 'decidedVia'> {
  datasetId: number
  decidedVia: DatasetDecidedVia
}

export interface TurnaroundReport<R> extends DarMetricsReport<TurnaroundBucket, R> {
  /** Decisions with no usable elapsed time (no vote date, or one before submission), left out of `total` and the statistics. */
  unmeasured: number
}

export type DarTurnaroundReport = TurnaroundReport<DarTurnaround>
export type DarDatasetTurnaroundReport = TurnaroundReport<DarDatasetTurnaround>

export type DarKind = 'ORIGINAL' | 'PROGRESS_REPORT' | 'CLOSEOUT'
export type SoApprovalStatus = 'APPROVED' | 'PENDING' | 'SKIPPED' | 'NOT_DETERMINED'

export interface SoApprovalBucket {
  bucketStart: number
  kind: DarKind
  status: SoApprovalStatus
  count: number
  unmeasured: number
  meanDays?: number | null
  medianDays?: number | null
  modeDays?: number | null
}

export interface SoApproval {
  referenceId: string
  collectionId: number
  kind: DarKind
  submissionDate: number
  status: SoApprovalStatus
  approvalDate?: number | null
  elapsedDays?: number | null
}

export type DarSoApprovalReport = DarMetricsReport<SoApprovalBucket, SoApproval>

export type AccessEndReason = 'EXPIRED' | 'CLOSED_OUT'

export interface ExpirationBucket {
  bucketStart: number
  reason: AccessEndReason
  count: number
}

export interface ExpiredCollection {
  collectionId: number
  darCode: string
  accessEnd: number
  reason: AccessEndReason
}

/** `from`, `to` and `bucket` apply to the access-end date, not submission. */
export type DarExpirationReport = DarMetricsReport<ExpirationBucket, ExpiredCollection>

export interface RenewalBucket {
  bucketStart: number
  renewalCount: number
  collectionCount: number
}

export interface Renewal {
  referenceId: string
  collectionId: number
  datasetId: number
  submissionDate: number
  decidedVia: DatasetDecidedVia
  approvalDate?: number | null
}

export type DarRenewalReport = DarMetricsReport<RenewalBucket, Renewal>
