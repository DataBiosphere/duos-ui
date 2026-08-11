import { Config } from 'src/libs/config'
import { fileDownload } from 'src/utils/FileDownload'
import { fetchDelete, fetchGet, fetchMultipart, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { Dataset, DatasetTerm } from 'src/types/model'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { ElasticsearchQuery, ElasticsearchResponse } from 'src/types/elastic'

export const DataSet = {
  /**
   * Fetch the list of all dataset names.
   * @returns Promise resolving to an array of dataset name strings
   */
  getDatasetNames: async (): Promise<string[]> => {
    const url = `${await Config.getApiUrl()}/api/dataset/datasetNames`
    const res = await fetchGet<string[]>(url)
    return res.data
  },

  /**
   * Register a new dataset using multipart form data.
   * @param registration FormData containing the dataset registration payload
   * @returns Promise resolving to the created Dataset
   */
  registerDataset: async (registration: FormData): Promise<Dataset> => {
    const url = `${await Config.getApiUrl()}/api/dataset/v3`
    const res = await fetchMultipart<Dataset>(url, registration)
    return res.data
  },

  /**
   * Fetch multiple datasets by their numeric IDs.
   * @param ids Array of dataset IDs
   * @returns Promise resolving to an array of Dataset objects
   */
  getDatasetsByIds: async (ids: number[]): Promise<Dataset[]> => {
    const url = `${await Config.getApiUrl()}/api/dataset/batch?ids=${ids.join('&ids=')}`
    const res = await fetchGet<Dataset[]>(url)
    return res.data
  },

  /**
   * Search the v1 dataset index with an Elasticsearch query.
   * @param query Elasticsearch query body
   * @param options Additional fetch options (e.g. `{ signal }` to support cancellation)
   * @returns Promise resolving to an array of DatasetTerm results
   */
  searchDatasetIndex: async (query: ElasticsearchQuery, options: { signal?: AbortSignal } = {}): Promise<DatasetTerm[]> => {
    const url = `${await Config.getApiUrl()}/api/dataset/search/index`
    const res = await fetchPost<DatasetTerm[]>(url, query, options)
    return res.data
  },

  /**
   * Search the v2 dataset index with an Elasticsearch query.
   * @param query Elasticsearch query body
   * @returns Promise resolving to an ElasticsearchResponse with items, total, and aggregations
   */
  searchDatasetIndexV2: async (query: ElasticsearchQuery): Promise<ElasticsearchResponse> => {
    const url = `${await Config.getApiUrl()}/api/dataset/search/index/v2`
    const res = await fetchPost<ElasticsearchResponse>(url, query)
    return res.data
  },

  /**
   * Fetch a single dataset by its numeric ID.
   * @param datasetId The dataset ID
   * @returns Promise resolving to the Dataset
   */
  getDataSetsByDatasetId: async (datasetId: number): Promise<Dataset> => {
    const url = `${await Config.getApiUrl()}/api/dataset/v2/${datasetId}`
    const res = await fetchGet<Dataset>(url)
    return res.data
  },

  /**
   * Delete a dataset by its object identifier.
   * @param datasetObjectId The dataset object ID or numeric ID
   * @returns Promise resolving to `{ status: 200 }` on success
   */
  deleteDataset: async (datasetObjectId: number | string): Promise<{ status: 200 }> => {
    const url = `${await Config.getApiUrl()}/api/dataset/${datasetObjectId}`
    await fetchDelete<void>(url)
    return { status: 200 }
  },

  /**
   * Update a dataset (v3) using multipart form data with a PUT request.
   * @param datasetId The dataset ID to update
   * @param datasetAndFiles FormData containing updated dataset fields and files
   * @returns Promise resolving to the updated Dataset
   */
  updateDatasetV3: async (datasetId: number | string, datasetAndFiles: FormData): Promise<Dataset> => {
    const url = `${await Config.getApiUrl()}/api/dataset/v3/${datasetId}`
    const res = await fetchMultipart<Dataset>(url, datasetAndFiles, {}, 'PUT')
    return res.data
  },

  /**
   * Fetch a study by its ID.
   * @param studyId The study ID
   * @returns Promise resolving to the Study
   */
  getStudyById: async (studyId: number | string): Promise<Study> => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchGet<Study>(url)
    return res.data
  },

  /**
   * Update a study using multipart form data with a PUT request.
   * @param studyId The study ID to update
   * @param studyObject FormData containing the updated study payload
   * @returns Promise resolving to the updated Study
   */
  updateStudy: async (studyId: number | string, studyObject: FormData): Promise<Study> => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchMultipart<Study>(url, studyObject, {}, 'PUT')
    return res.data
  },

  /**
   * Download the NIH Institutional Certification file for a dataset.
   * @param datasetId The dataset ID whose certification file should be downloaded
   * @returns Promise that resolves when the download is triggered
   */
  getNIHInstitutionalCertification: async (datasetId: number | undefined): Promise<void> => {
    if (datasetId === undefined) return
    const datasetInfo = await DataSet.getDataSetsByDatasetId(datasetId)
    const fileName = datasetInfo.nihInstitutionalCertificationFile?.fileName ?? ''
    const config = {
      responseType: 'blob' as const,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/dataset/${datasetId}/nihInstitutionalCertification`
    const res = await fetchGet<Blob>(url, config)
    fileDownload(res.data, fileName)
  },
}
