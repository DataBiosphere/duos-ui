import { Draft } from 'src/libs/ajax/Draft'
import { datasetSchemaSubmissionToStudy } from 'src/pages/data_submission/v2/v2-common-functions'
import { DatasetRegistrationSchemaV1, Study } from 'src/pages/data_submission/v2/v2-models'
import { isStudyDatasetDraft } from 'src/types/draft'

/** A draft that belongs to another workflow. Loading it here is an error, not something to submit. */
export class WrongDraftTypeError extends Error {
  constructor(draftType: string | undefined) {
    super(`Draft is of type ${draftType ?? 'unknown'}, not a study/dataset draft`)
    this.name = 'WrongDraftTypeError'
  }
}

/**
 * Loads a draft and maps it into the form's model, refusing anything that is not a study/dataset
 * draft: the read endpoint is generic, so the id says nothing about what the draft holds.
 * @param draftUuid The draft UUID
 * @returns Promise resolving to the study the form should edit
 */
export const loadStudyDatasetDraft = async (draftUuid: string): Promise<Study> => {
  const draft = await Draft.getDraft(draftUuid)
  if (!isStudyDatasetDraft(draft)) {
    throw new WrongDraftTypeError(draft?.meta?.draftType)
  }
  return datasetSchemaSubmissionToStudy(draft.document as unknown as DatasetRegistrationSchemaV1)
}
