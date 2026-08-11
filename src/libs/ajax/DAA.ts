import { fileDownload } from 'src/utils/FileDownload'
import { Config } from 'src/libs/config'
import { isFileEmpty } from 'src/libs/utils'
import {
  fetchBlob,
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  fetchMultipart,
  type FetchData,
} from 'src/libs/ajax/fetchAdapter'
import type { DAAObject, DaaBulkRelationResult } from 'src/types/model'

type FetchDeleteConfig<T> = Parameters<typeof fetchDelete<T>>[1]

export const DAA = {
  getDaas: async (): Promise<DAAObject[]> => {
    const url = `${await Config.getApiUrl()}/api/daa`
    const res = await fetchGet<DAAObject[]>(url)
    return res.data
  },

  getDaaById: async (daaId: number): Promise<DAAObject> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}`
    const res = await fetchGet<DAAObject>(url)
    return res.data
  },

  createDaaLcLink: async (daaId: number, userId: number): Promise<DAAObject> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/${userId}`
    const res = await fetchPut<DAAObject>(url, {})
    return res.data
  },

  deleteDaaLcLink: async (daaId: number, userId: number): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/${userId}`
    await fetchDelete<void>(url)
    return 200
  },

  bulkAddUsersToDaa: async (daaId: number, userList: number[]): Promise<DaaBulkRelationResult> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/${daaId}`
    const res = await fetchPost<DaaBulkRelationResult, { users: number[] }>(
      url, { users: userList },
    )
    return res.data
  },

  bulkRemoveUsersFromDaa: async (daaId: number, userList: number[]): Promise<DaaBulkRelationResult> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/${daaId}`
    const config = { data: { users: userList } }
    const res = await fetchDelete<DaaBulkRelationResult>(url, config as FetchDeleteConfig<DaaBulkRelationResult>)
    return res.data
  },

  bulkAddDaasToUser: async (userId: number, daaList: number[]): Promise<DaaBulkRelationResult> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/user/${userId}`
    const res = await fetchPost<DaaBulkRelationResult, { daaList: number[] }>(
      url, { daaList },
    )
    return res.data
  },

  bulkRemoveDaasFromUser: async (userId: number, daaList: number[]): Promise<DaaBulkRelationResult> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/user/${userId}`
    const config = { data: { daaList } }
    const res = await fetchDelete<DaaBulkRelationResult>(url, config as FetchDeleteConfig<DaaBulkRelationResult>)
    return res.data
  },

  getDaaFileById: async (daaId: number, daaFileName: string): Promise<void> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/file`
    const blob = await fetchBlob(url)
    fileDownload(blob, daaFileName)
  },

  getDaaFileBlob: async (daaId: number): Promise<Blob> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/file`
    return fetchBlob(url)
  },

  createDaa: async (file: File | null | undefined, dacId: number): Promise<FetchData<DAAObject | null>> => {
    if (isFileEmpty(file)) {
      return { data: null }
    }
    else {
      // Do not set Content-Type for FormData; browser will set it
      const formData = new FormData()
      formData.append('file', file as File)
      const url = `${await Config.getApiUrl()}/api/daa/dac/${dacId}`
      return fetchMultipart<DAAObject>(url, formData)
    }
  },

  addDaaToDac: async (daaId: number, dacId: number): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/dac/${dacId}`
    await fetchPut<void>(url, {})
    return 200
  },

  deleteDacDaaRelationship: async (daaId: number, dacId: number): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/dac/${dacId}`
    await fetchDelete<void>(url)
    return 200
  },

  // NOTE: In the future, this functionality should be handled in the backend and should not be
  // dependent on the UI.
  sendDaaUpdateEmails: async (dacId: number, oldDaaId: number, newDaaName: string): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${dacId}/updated/${oldDaaId}/${newDaaName}`
    await fetchPost<void>(url, {})
    return 200
  },
}
