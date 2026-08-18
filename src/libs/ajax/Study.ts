import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import {
  ClinicalTrialAsset,
  FundingResourceAsset,
  IntellectualPropertyAsset,
  ModelAsset,
  PresentationAsset,
  PublicationAsset,
  WorkspaceAsset,
} from 'src/types/library'
import { Study as StudyModel } from 'src/types/model'

export interface StudyAssetCounts {
  datasetCount: number
  modelCount: number
  workspaceCount: number
  presentationCount: number
  publicationCount: number
  clinicalTrialCount: number
  intellectualPropertyCount: number
  fundingResourceCount: number
  dataTypes: string[]
}

const assetsUrl = async (studyId: number | string, path: string): Promise<string> =>
  `${await Config.getApiUrl()}/api/dataset/study/${studyId}/assets/${path}`

export const Study = {
  /**
   * Retrieves all study names registered in the system.
   * @returns Promise resolving to an array of study name strings
   */
  getStudyNames: async (): Promise<string[]> => {
    const url = `${await Config.getApiUrl()}/api/dataset/studyNames`
    const res = await fetchGet<string[]>(url, Config.authOpts())
    return res.data
  },

  getAssetCounts: async (studyId: number | string): Promise<StudyAssetCounts> => {
    const res = await fetchGet<StudyAssetCounts>(await assetsUrl(studyId, 'counts'), Config.authOpts())
    return res.data
  },

  /**
   * Fetches the study directly from the relational store (not the Elasticsearch-backed search
   * index used elsewhere on the study page), for fields the index doesn't carry, e.g. PI
   * institution/external profile links.
   */
  getById: async (studyId: number | string): Promise<StudyModel> => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchGet<StudyModel>(url, Config.authOpts())
    return res.data
  },

  getModels: async (studyId: number | string): Promise<ModelAsset[]> => {
    const res = await fetchGet<ModelAsset[]>(await assetsUrl(studyId, 'models'), Config.authOpts())
    return res.data
  },

  getWorkspaces: async (studyId: number | string): Promise<WorkspaceAsset[]> => {
    const res = await fetchGet<WorkspaceAsset[]>(await assetsUrl(studyId, 'workspaces'), Config.authOpts())
    return res.data
  },

  getPresentations: async (studyId: number | string): Promise<PresentationAsset[]> => {
    const res = await fetchGet<PresentationAsset[]>(await assetsUrl(studyId, 'presentations'), Config.authOpts())
    return res.data
  },

  getPublications: async (studyId: number | string): Promise<PublicationAsset[]> => {
    const res = await fetchGet<PublicationAsset[]>(await assetsUrl(studyId, 'publications'), Config.authOpts())
    return res.data
  },

  getClinicalTrials: async (studyId: number | string): Promise<ClinicalTrialAsset[]> => {
    const res = await fetchGet<ClinicalTrialAsset[]>(await assetsUrl(studyId, 'clinicalTrials'), Config.authOpts())
    return res.data
  },

  getIntellectualProperty: async (studyId: number | string): Promise<IntellectualPropertyAsset[]> => {
    const res = await fetchGet<IntellectualPropertyAsset[]>(
      await assetsUrl(studyId, 'intellectualProperty'), Config.authOpts(),
    )
    return res.data
  },

  getFundingResources: async (studyId: number | string): Promise<FundingResourceAsset[]> => {
    const res = await fetchGet<FundingResourceAsset[]>(
      await assetsUrl(studyId, 'fundingResources'), Config.authOpts(),
    )
    return res.data
  },
}
