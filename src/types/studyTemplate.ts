/**
 * Wire types for study-template validation. Canonical contract: `docs/study-template-v1.md` in the
 * `consent` repository.
 */

export const STUDY_DATASET_DRAFT_TYPE = 'StudyDatasetSubmissionV1'

/**
 * One independently actionable validation error. `row` is the one-based physical line the record
 * starts on — an ignored blank line still occupies one, and a multi-line value reports its first.
 * A registration-validator violation may carry neither row nor column, and its location must never
 * be inferred from the message text.
 */
export interface TemplateValidationError {
  row?: number
  column?: string
  message: string
}

export interface StudyDatasetDraftReference {
  id: string
  draftType: typeof STUDY_DATASET_DRAFT_TYPE
}

/**
 * `truncated` reports that the 100-error cap was reached. Consent also appends a trailing
 * message-only error saying so, so it is optional here: the notice renders either way.
 */
export type TemplateValidationResponse
  = | { valid: false, errors: TemplateValidationError[], truncated?: boolean }
    | { valid: true, errors: TemplateValidationError[], truncated?: boolean, draft: StudyDatasetDraftReference }
