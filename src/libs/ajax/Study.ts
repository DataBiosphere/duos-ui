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

const assetsUrl = async (studyId: number | string, path: string): Promise<string> =>
  `${await Config.getApiUrl()}/api/dataset/study/${studyId}/assets/${path}`

const getAssets = async <T>(studyId: number | string, path: string): Promise<T[]> =>
  (await fetchGet<T[]>(await assetsUrl(studyId, path), Config.authOpts())).data

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

  /**
   * Fetches a study from the relational store, not the Elasticsearch-backed search index the
   * study page uses elsewhere, for fields the index doesn't carry — PI institution and external
   * profile links.
   *
   * The only implementation of this endpoint: `DataSet.getStudyById` delegates here, typing the
   * same payload as the data-submission form's editable `Study` shape rather than this one.
   */
  getById: async <T = StudyModel>(studyId: number | string): Promise<T> => {
    const url = `${await Config.getApiUrl()}/api/dataset/study/${studyId}`
    const res = await fetchGet<T>(url, Config.authOpts())
    return res.data
  },

  getModels: (studyId: number | string) => getAssets<ModelAsset>(studyId, 'models'),

  getWorkspaces: (studyId: number | string) => getAssets<WorkspaceAsset>(studyId, 'workspaces'),

  getPresentations: (studyId: number | string) => getAssets<PresentationAsset>(studyId, 'presentations'),

  getPublications: async (studyId: number | string): Promise<PublicationAsset[]> => {
    const publications = await getAssets<PublicationAsset>(studyId, 'publications')
    return publications.map(publication => ({
      ...publication,
      studyName: publication.studyName ?? '',
      authorNames: publication.authorNames
        ?? publication.authors?.map(author => author.name).filter(Boolean)
        ?? [],
    }))
  },

  getClinicalTrials: (studyId: number | string) => getAssets<ClinicalTrialAsset>(studyId, 'clinicalTrials'),

  getIntellectualProperty: (studyId: number | string) =>
    getAssets<IntellectualPropertyAsset>(studyId, 'intellectualProperty'),

  getFundingResources: (studyId: number | string) =>
    getAssets<FundingResourceAsset>(studyId, 'fundingResources'),
}
