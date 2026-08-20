import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart } from 'src/libs/ajax/fetchAdapter'
import { DraftDetail } from 'src/types/draft'
import { TemplateValidationResponse } from 'src/types/studyTemplate'

export const Draft = {
  /**
   * Validate a filled-in study/dataset template. A valid template creates a
   * `StudyDatasetSubmissionV1` draft and the response carries its typed reference.
   *
   * Validation failures are a completed result, not a request failure: the endpoint answers 200 with
   * `valid: false`, so callers get them as data and must render them separately from a thrown error.
   * @param file The CSV template to validate
   * @returns Promise resolving to the discriminated validation response
   */
  validateStudyDatasetTemplate: async (file: File): Promise<TemplateValidationResponse> => {
    const url = `${await Config.getApiUrl()}/api/draft/v1/study-dataset/template-validation`
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetchMultipart<TemplateValidationResponse>(url, formData, Config.multiPartOpts())
    return res.data
  },

  /**
   * Load a draft's document and metadata. The endpoint is generic across draft types, so a caller
   * must check `meta.draftType` before mapping the document.
   * @param draftId The draft UUID
   * @returns Promise resolving to the draft document and its metadata
   */
  getDraft: async (draftId: string): Promise<DraftDetail> => {
    const url = `${await Config.getApiUrl()}/api/draft/v1/${draftId}`
    const res = await fetchGet<DraftDetail>(url, Config.authOpts())
    return res.data
  },

  /**
   * Delete a draft and its attachments. Used after the study it seeded has been created, so a
   * failure here leaves a study that exists and a draft that outlived its purpose.
   * @param draftId The draft UUID
   */
  deleteDraft: async (draftId: string): Promise<void> => {
    const url = `${await Config.getApiUrl()}/api/draft/v1/${draftId}`
    await fetchDelete<void>(url, Config.authOpts())
  },
}
