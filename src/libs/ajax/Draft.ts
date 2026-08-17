import { Config } from 'src/libs/config'
import { fetchMultipart } from 'src/libs/ajax/fetchAdapter'
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
}
