/**
 * Wire types for the generic draft endpoints. A draft's document is whatever its type says it is,
 * so `meta.draftType` is what a caller must check before mapping one — never the id it was loaded
 * by or the route that loaded it.
 */

import { STUDY_DATASET_DRAFT_TYPE } from 'src/types/studyTemplate'

export interface DraftUser {
  userId: number
  email: string
  displayName?: string
  createDate?: number
  emailPreference?: boolean
}

export interface DraftMeta {
  uuid: string
  name: string
  draftType: string
  createDate: number
  updateDate: number
  createUser: DraftUser
  updateUser: DraftUser
  storedFiles?: unknown[]
}

export interface DraftDetail<TDocument = unknown> {
  document: TDocument
  meta: DraftMeta
}

/**
 * Whether a loaded draft is one this workflow may map. A draft of another type belongs to another
 * workflow: it is a recoverable load error rather than something to submit or delete from here.
 */
export const isStudyDatasetDraft = (
  draft: DraftDetail,
): draft is DraftDetail<Record<string, unknown>> =>
  draft?.meta?.draftType === STUDY_DATASET_DRAFT_TYPE
