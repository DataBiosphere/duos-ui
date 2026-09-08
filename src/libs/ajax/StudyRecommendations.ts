import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { StudyAggregation } from 'src/types/library'

const get = async (studyId: number | string, path: string): Promise<StudyAggregation[]> => {
  const url = `${await Config.getApiUrl()}/api/metrics/study-recommendations/${studyId}/${path}`
  return (await fetchGet<StudyAggregation[]>(url, Config.authOpts())).data
}

export const StudyRecommendations = {
  getSimilar: (studyId: number | string) => get(studyId, 'similar'),
  getFrequentlyRequestedWith: (studyId: number | string) => get(studyId, 'frequently-requested-with'),
}
