import { fileDownload } from '../../utils/FileDownload'
import { omit } from 'src/utils/NodashUtil'
import { Config } from '../config'
import { isFileEmpty } from '../utils'
import { Metrics } from './Metrics'
import eventList from '../events'
import { fetchGet, fetchMultipart, fetchPost, fetchPut, fetchDelete, FetchData } from 'src/libs/ajax/fetchAdapter'
import { DataAccessRequest, OntologyEntry } from 'src/types/model'

export interface DatasetDaaSnapshot {
  datasetId?: number
  daaId?: number
  daaFileName?: string
  dataset?: { datasetId: number }
  daa?: { daaId: number, file?: { fileName: string } }
}

export const DAR = {
  /**
   * Fetch a partial (draft or submitted) DAR by its ID.
   * @param darId The DAR reference ID
   * @returns The DataAccessRequest object
   */
  getPartialDarRequest: async (darId: string): Promise<DataAccessRequest> => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}`
    const res = await fetchGet<DataAccessRequest>(url, Config.authOpts())
    return res.data
  },

  /**
   * Update an existing draft DAR.
   * @param dar The DAR form data to save
   * @param referenceId The reference ID of the draft to update
   * @returns The updated DataAccessRequest
   */
  updateDarDraft: async (dar: Record<string, unknown>, referenceId: string): Promise<DataAccessRequest> => {
    Metrics.captureEvent(eventList.dar, { action: 'update' })
    const url = `${await Config.getApiUrl()}/api/dar/v2/draft/${referenceId}`
    const res = await fetchPut<DataAccessRequest>(url, dar, Config.authOpts())
    return res.data
  },

  /**
   * Create a new draft DAR.
   * @param dar The initial DAR form data
   * @returns The newly created DataAccessRequest
   */
  postDarDraft: async (dar: Record<string, unknown>): Promise<DataAccessRequest & { code?: number, message?: string }> => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'draft' })
    const url = `${await Config.getApiUrl()}/api/dar/v2/draft`
    const res = await fetchPost<DataAccessRequest & { code?: number, message?: string }>(url, dar, Config.authOpts())
    return res.data
  },

  /**
   * Delete a DAR by its reference ID.
   * @param darId The DAR reference ID to delete
   * @returns An object with status 200 on success
   */
  deleteDar: async (darId: string): Promise<{ status: number }> => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}`
    await fetchDelete(url, Config.authOpts())
    return { status: 200 }
  },

  /**
   * Submit a DAR for review.
   * Strips createDate and data_access_request_id from the payload before posting.
   * @param dar The complete DAR form data
   * @returns The submitted DataAccessRequest
   */
  postDar: async (dar: Record<string, unknown>): Promise<DataAccessRequest> => {
    // noinspection ES6MissingAwait
    Metrics.captureEvent(eventList.dar, { action: 'submit' })
    const filteredDar = omit(dar, ['createDate', 'data_access_request_id'])
    const url = `${await Config.getApiUrl()}/api/dar/v2`
    const res = await fetchPost<DataAccessRequest>(url, filteredDar, Config.authOpts())
    return res.data
  },

  /**
   * Fetch ontology term autocomplete suggestions for a partial query string.
   * @param partial The partial search term or array of terms
   * @returns Array of matching OntologyEntry results
   */
  getAutoCompleteOT: async (partial: string | string[]): Promise<OntologyEntry[]> => {
    const url = `${await Config.getApiUrl()}/ontology/autocomplete?q=${partial}`
    const res = await fetchGet<OntologyEntry[]>(url, Config.authOpts())
    return res.data
  },

  /**
   * Fetch ontology entries for a list of ontology IDs.
   * Returns an empty array if ids is empty or on fetch error.
   * @param ids The ontology IDs to look up
   * @returns Array of matching OntologyEntry results, or [] on error
   */
  searchOntologyIdList: async (ids: string[]): Promise<OntologyEntry[]> => {
    if (!ids || ids.length === 0) {
      return []
    }
    const url = `${await Config.getApiUrl()}/ontology/search?ids=${ids}`
    try {
      const res = await fetchGet<OntologyEntry[]>(url, Config.authOpts())
      return res.data
    }
    catch {
      return []
    }
  },

  /**
   * Download a DAR-attached document (e.g. IRB certificate, collaboration letter) as a file.
   * @param referenceId The DAR reference ID
   * @param fileType The document type slug (e.g. 'irbDocument', 'collaborationDocument')
   * @param fileName The filename to save as
   */
  downloadDARDocument: async (referenceId: string, fileType: string, fileName: string): Promise<void> => {
    const authOpts = {
      ...Config.authOpts(),
      responseType: 'blob' as const,
      headers: {
        ...Config.authOpts().headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`
    const res = await fetchGet<Blob>(url, authOpts)
    fileDownload(res.data, fileName)
  },

  /**
   * Fetch a DAR-attached document as a Blob for programmatic use (e.g. opening in a new tab).
   * @param referenceId The DAR reference ID
   * @param fileType The document type slug (e.g. 'irbDocument', 'collaborationDocument')
   * @returns The document as a Blob
   */
  getDARDocumentAsBlob: async (referenceId: string, fileType: string): Promise<Blob> => {
    const authOpts = {
      ...Config.authOpts(),
      responseType: 'blob' as const,
      headers: {
        ...Config.authOpts().headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`
    const res = await fetchGet<Blob>(url, authOpts)
    return res.data
  },

  /**
   * Fetch the dataset–DAA relationship snapshots for a submitted DAR.
   * Each element may use a flat shape (datasetId/daaId/daaFileName) or a nested shape
   * (dataset.datasetId / daa.daaId / daa.file.fileName).
   * @param referenceId The DAR reference ID
   * @returns Array of DatasetDaaSnapshot records
   */
  getDatasetDaaSnapshots: async (referenceId: string): Promise<DatasetDaaSnapshot[]> => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${referenceId}/dataset-daa-snapshots`
    const res = await fetchGet<DatasetDaaSnapshot[]>(url, Config.authOpts())
    return res.data
  },

  /**
   * Upload a document (IRB certificate or collaboration letter) for a DAR.
   * No-ops and returns { data: null } if the file is empty.
   * @param file The file to upload
   * @param darId The DAR reference ID to attach the document to
   * @param fileType The document type slug (e.g. 'irbDocument', 'collaborationDocument')
   * @returns FetchData wrapping the updated DataAccessRequest, or { data: null } if file was empty
   */
  uploadDARDocument: async (file: File, darId: string, fileType: string): Promise<FetchData<DataAccessRequest | null>> => {
    if (isFileEmpty(file)) {
      return { data: null }
    }
    else {
      const authOpts = Config.authOpts()
      // Do not set Content-Type for FormData; browser will set it
      const formData = new FormData()
      formData.append('file', file)
      const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}/${fileType}`
      return fetchMultipart<DataAccessRequest>(url, formData, authOpts)
    }
  },

  /**
   * Approve the closeout of a DAR.
   * @param referenceId The DAR reference ID
   * @returns The HTTP status from the response envelope (undefined in practice; preserved for API compatibility)
   */
  approveCloseout: async (referenceId: string): Promise<number | undefined> => {
    const url = `${await Config.getApiUrl()}/api/dar/${referenceId}/approveCloseout`
    const res = await fetchPut(url, {}, Config.authOpts())
    // FetchData only exposes .data; .status is always undefined here, preserved for API compatibility
    return (res as unknown as { status?: number }).status
  },
}
