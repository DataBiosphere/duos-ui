import * as fp from 'lodash/fp'
import { Config } from '../config'
import axios from 'axios'
import { fetchOk, getApiUrl } from '../ajax'
import { AdvancedFormState } from 'src/pages/data_submission_v2/AdvancedDataSubmissionForm'

export const Draft = {
  getDrafts: async () => {
    const url = `${await getApiUrl()}/api/draft/v1`
    const res = await axios.get(url, Config.authOpts())
    return await res.data
  },
  postDraft: async (draft: AdvancedFormState) => {
    const url = `${await getApiUrl()}/api/draft/v1`
    const res = await axios.post(url, draft, Config.authOpts())
    const location = await res.headers.location
    const id = extractIdFromLocation(location)
    const data = await res.data
    return { id: id, data: data }
  },
  getDraftById: async (id: string) => {
    const url = `${await getApiUrl()}/api/draft/v1/${id}`
    const res = await axios.get(url, Config.authOpts())
    return await res.data
  },
  editDraft: async (id: string, data: AdvancedFormState) => {
    const url = `${await getApiUrl()}/api/draft/v1/${id}`
    const res = await axios.put(url, data, Config.authOpts())
    return await res.data
  },
  deleteDraft: async (id: string) => {
    const url = `${await getApiUrl()}/api/draft/v1/${id}`
    return await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]))
  },
  getDraftAttachments: async (id: string) => {
    const url = `${await getApiUrl()}/api/draft/v1/${id}/attachments`
    const res = await axios.get(url, Config.authOpts())
    return await res.data
  },
  deleteDraftAttachment: async (id: string | null | undefined, attachmentId: number) => {
    if (id === undefined || id === null) {
      return
    }
    const url = `${await getApiUrl()}/api/draft/v1/${id}/attachments/${attachmentId}`
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]))
    return res.status
  },
  uploadFilesToDraft: async (draftId: string, files: FileList | FormData | null) => {
    const url = `${await getApiUrl()}/api/draft/v1/${draftId}/attachments`
    const response = await axios.post(url, files, Config.multiPartOpts())
    return response.data
  },
}

function extractIdFromLocation(location: string): string | undefined {
  const values = location.split('/')
  if (values.length > 0) {
    return values.at(-1)
  }
  else {
    return undefined
  }
}
