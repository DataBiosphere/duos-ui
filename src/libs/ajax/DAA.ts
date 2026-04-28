import { fileDownload } from 'src/utils/FileDownload'
import { Config } from 'src/libs/config'
import { isFileEmpty } from 'src/libs/utils'
import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  fetchMultipart,
  type FetchData,
} from 'src/libs/ajax/fetchAdapter'
import type { DAAObject } from 'src/types/model'

type AuthConfig = ReturnType<typeof Config.authOpts>
type DeleteBodyConfig<TBody> = AuthConfig & { data: TBody }
type FetchDeleteConfig<T> = Parameters<typeof fetchDelete<T>>[1]

type DaaBinaryDownloadConfig = {
  responseType: 'blob'
  headers: {
    'Authorization': string
    'Accept': string
    'X-App-ID': string
    'Content-Type': 'application/octet-stream'
  }
}

export const DAA = {
  getDaas: async (): Promise<DAAObject[]> => {
    const url = `${await Config.getApiUrl()}/api/daa`
    const res = await fetchGet<DAAObject[]>(url, Config.authOpts())
    return res.data
  },

  getDaaById: async (daaId: number): Promise<DAAObject> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}`
    const res = await fetchGet<DAAObject>(url, Config.authOpts())
    return res.data
  },

  createDaaLcLink: async (daaId: number, userId: number): Promise<DAAObject> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/${userId}`
    const res = await fetchPut<DAAObject>(url, {}, Config.authOpts())
    return res.data
  },

  deleteDaaLcLink: async (daaId: number, userId: number): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/${userId}`
    await fetchDelete<void>(url, Config.authOpts())
    return 200
  },

  bulkAddUsersToDaa: async (daaId: number, userList: number[]): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/${daaId}`
    await fetchPost<void, number[]>(url, userList, Config.authOpts())
    return 200
  },

  bulkRemoveUsersFromDaa: async (daaId: number, userList: number[]): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/${daaId}`
    const config: DeleteBodyConfig<number[]> = { ...Config.authOpts(), data: userList }
    await fetchDelete<void>(url, config as FetchDeleteConfig<void>)
    return 200
  },

  bulkAddDaasToUser: async (userId: number, daaList: number[]): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/user/${userId}`
    await fetchPost<void, number[]>(url, daaList, Config.authOpts())
    return 200
  },

  bulkRemoveDaasFromUser: async (userId: number, daaList: number[]): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/bulk/user/${userId}`
    const config: DeleteBodyConfig<number[]> = { ...Config.authOpts(), data: daaList }
    await fetchDelete<void>(url, config as FetchDeleteConfig<void>)
    return 200
  },

  getDaaFileById: async (daaId: number, daaFileName: string): Promise<void> => {
    const auth = Config.authOpts()
    const authOpts: DaaBinaryDownloadConfig = {
      ...auth,
      responseType: 'blob',
      headers: {
        ...auth.headers,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/octet-stream',
      },
    }
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/file`
    const res = await fetchGet<Blob>(url, authOpts)
    fileDownload(res.data, daaFileName)
  },

  createDaa: async (file: File | null | undefined, dacId: number): Promise<FetchData<DAAObject | null>> => {
    if (isFileEmpty(file)) {
      return { data: null }
    }
    else {
      const authOpts = Config.authOpts()
      // Do not set Content-Type for FormData; browser will set it
      const formData = new FormData()
      formData.append('file', file as File)
      const url = `${await Config.getApiUrl()}/api/daa/dac/${dacId}`
      return fetchMultipart<DAAObject>(url, formData, authOpts)
    }
  },

  addDaaToDac: async (daaId: number, dacId: number): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/dac/${dacId}`
    await fetchPut<void>(url, {}, Config.authOpts())
    return 200
  },

  deleteDacDaaRelationship: async (daaId: number, dacId: number): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${daaId}/dac/${dacId}`
    await fetchDelete<void>(url, Config.authOpts())
    return 200
  },

  // NOTE: In the future, this functionality should be handled in the backend and should not be
  // dependent on the UI.
  sendDaaUpdateEmails: async (dacId: number, oldDaaId: number, newDaaName: string): Promise<number> => {
    const url = `${await Config.getApiUrl()}/api/daa/${dacId}/updated/${oldDaaId}/${newDaaName}`
    await fetchPost<void>(url, {}, Config.authOpts())
    return 200
  },
}
