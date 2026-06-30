/**
 * Client-managed metadata stored in the `data` field on Study and
 * Dataset/ConsentGroup objects. These keys are not validated by the backend.
 * The backend stores and returns the `data` bag opaquely; all key semantics
 * are owned by the frontend.
 */

/** Keys for `Study.data`. */
export const StudyDataKeys = {
  TAGS: 'tags',
} as const
export type StudyDataKey = typeof StudyDataKeys[keyof typeof StudyDataKeys]

/** Typed overlay for `Study.data`. Unknown keys are preserved for round-trip. */
export interface StudyDataMetadata {
  [key: string]: unknown
  /** Free-form tags for study discovery (e.g. disease area, assay type). */
  tags?: string[]
}

/**
 * Keys for `ConsentGroup2.data` (dataset level).
 * Kept separate from StudyDataKeys intentionally: Study and Dataset are distinct
 * backend objects whose data bags may evolve independently.
 */
export const DatasetDataKeys = {
  TAGS: 'tags',
  CLOUD: 'cloud',
} as const
export type DatasetDataKey = typeof DatasetDataKeys[keyof typeof DatasetDataKeys]

/** Typed overlay for `ConsentGroup2.data`. Unknown keys are preserved for round-trip. */
export interface DatasetDataMetadata {
  [key: string]: unknown
  /** Free-form tags for dataset discovery (e.g. disease area, assay type). */
  tags?: string[]
  /** Cloud providers where data is hosted (e.g. 'GCP', 'AWS'). */
  cloud?: string[]
}

/**
 * Elasticsearch field paths derived from StudyDataKeys.
 * These are query-time paths, not stored data shapes.
 */
const _studyDataTagsEsField = 'study.data.tags' as const
export const StudyDataEsFields = {
  TAGS: _studyDataTagsEsField,
  TAGS_KEYWORD: `${_studyDataTagsEsField}.keyword` as const,
} as const
