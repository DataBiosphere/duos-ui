/**
 * Wire types for study-template validation. Canonical contract: `docs/study-template-v1.md` in the
 * `consent` repository.
 */

export const STUDY_DATASET_DRAFT_TYPE = 'StudyDatasetSubmissionV1'

/**
 * One independently actionable validation error. `row` is one-based and counts the CSV header as
 * row 1. Parser and conversion errors carry a row, and a column when a single cell is at fault;
 * registration-validator violations may carry neither, and their location must never be inferred
 * from the message text.
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
