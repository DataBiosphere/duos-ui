import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { StudyComment, StudyCommentsSummary } from 'src/types/model'

const urlFor = async (studyId: string | number) => `${await Config.getApiUrl()}/api/dataset/study/${studyId}/comments`

export const StudyComments = {
  listComments: async (studyId: string | number): Promise<StudyCommentsSummary> =>
    (await fetchGet<StudyCommentsSummary>(await urlFor(studyId), Config.authOpts())).data,
  postComment: async (studyId: string | number, rating: number, commentText: string): Promise<StudyComment> =>
    (await fetchPost<StudyComment>(await urlFor(studyId), { rating, commentText }, Config.authOpts())).data,
  deleteComment: async (studyId: string | number, commentId: number): Promise<void> => {
    await fetchDelete<void>(`${await urlFor(studyId)}/${commentId}`, Config.authOpts())
  },
}
