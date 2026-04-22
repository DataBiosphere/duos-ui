import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchMultipart, fetchPut } from 'src/libs/ajax/fetchAdapter'
import type { FileStorageObject as SharedFileStorageObject } from 'src/types/model'

export enum FileCategory {
  IRB_COLLABORATION_LETTER = 'irbCollaborationLetter',
  DATA_USE_LETTER = 'dataUseLetter',
  ALTERNATIVE_DATA_SHARING_PLAN = 'alternativeDataSharingPlan',
  NIH_INSTITUTIONAL_CERTIFICATION = 'nihInstitutionalCertification',
  DATA_ACCESS_AGREEMENT = 'dataAccessAgreement',
}

export enum EntityType {
  DAC = 'dac',
  DAR = 'dar',
  DATASET = 'dataset',
  STUDY = 'study',
}

export type FileStorageObject = SharedFileStorageObject

function basePath(entity: EntityType, entityId: string): string {
  return `/api/${encodeURIComponent(entity)}/${encodeURIComponent(entityId)}/document`
}

function documentPath(entity: EntityType, entityId: string, id: number): string {
  return `${basePath(entity, entityId)}/${encodeURIComponent(id)}`
}

export async function uploadDocument(
  entity: EntityType,
  entityId: string,
  file: File,
  category: FileCategory,
): Promise<FileStorageObject> {
  const apiUrl = await Config.getApiUrl()
  const url = `${apiUrl}${basePath(entity, entityId)}`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  const res = await fetchMultipart<FileStorageObject>(url, formData, Config.multiPartOpts())
  return res.data
}

export async function updateDocumentCategory(
  entity: EntityType,
  entityId: string,
  id: number,
  category: FileCategory,
): Promise<FileStorageObject> {
  const apiUrl = await Config.getApiUrl()
  const url = `${apiUrl}${documentPath(entity, entityId, id)}`
  const res = await fetchPut<FileStorageObject>(url, { category }, Config.authOpts())
  return res.data
}

export async function getDocument(
  entity: EntityType,
  entityId: string,
  id: number,
): Promise<FileStorageObject> {
  const apiUrl = await Config.getApiUrl()
  const url = `${apiUrl}${documentPath(entity, entityId, id)}`
  const res = await fetchGet<FileStorageObject>(url, Config.authOpts())
  return res.data
}

export async function getDocumentFile(
  entity: EntityType,
  entityId: string,
  id: number,
): Promise<Blob> {
  const apiUrl = await Config.getApiUrl()
  const url = `${apiUrl}${documentPath(entity, entityId, id)}/file`
  const res = await fetchGet<Blob>(url, {
    ...Config.authOpts(),
    responseType: 'blob',
    headers: {
      ...Config.authOpts().headers,
      'Accept': 'application/octet-stream',
    },
  })
  return res.data
}

export async function listDocuments(
  entity: EntityType,
  entityId: string,
): Promise<FileStorageObject[]> {
  const apiUrl = await Config.getApiUrl()
  const url = `${apiUrl}${basePath(entity, entityId)}`
  const res = await fetchGet<FileStorageObject[]>(url, Config.authOpts())
  return res.data
}

export async function deleteDocument(
  entity: EntityType,
  entityId: string,
  id: number,
): Promise<FileStorageObject> {
  const apiUrl = await Config.getApiUrl()
  const url = `${apiUrl}${documentPath(entity, entityId, id)}`
  const res = await fetchDelete<FileStorageObject>(url, Config.authOpts())
  return res.data
}
