import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { StudyRecommendation } from 'src/types/model'

// The id comes off the route already decoded, so '1%2F..%2Fdar-summaries%2F5' arrives as a path
// of its own and the browser would normalize the request onto a different endpoint. StudyComments
// encodes its id for the same reason.
const get = async (studyId: number | string, path: string): Promise<StudyRecommendation[]> => {
  const url = `${await Config.getApiUrl()}/api/metrics/study-recommendations/${encodeURIComponent(studyId)}/${path}`
  return (await fetchGet<StudyRecommendation[]>(url, Config.authOpts())).data
}

export const StudyRecommendations = {
  getSimilar: (studyId: number | string) => get(studyId, 'similar'),
  getFrequentlyRequestedWith: (studyId: number | string) => get(studyId, 'frequently-requested-with'),
}
