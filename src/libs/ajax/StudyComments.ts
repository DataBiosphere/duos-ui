import { Config } from 'src/libs/config'
import { fetchDelete, fetchGet, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { StudyComment, StudyCommentsSummary } from 'src/types/model'

const urlFor = async (studyId: string | number) => `${await Config.getApiUrl()}/api/dataset/study/${studyId}/comments`

/** What the backend accepts per page, and what it rejects above. Keep in step with StudyCommentService. */
export const COMMENTS_PAGE_SIZE = 25

/** The longest comment the backend stores; a longer one comes back as a 400. */
export const MAX_COMMENT_LENGTH = 2000

export const StudyComments = {
  /**
   * One page of a study's comments, newest first by when they were posted. The endpoint is paged
   * and defaults to a bounded page, so an omitted `offset` is the first page rather than all of
   * them. `averageRating` and `total` describe the whole study, not the page.
   */
  listComments: async (
    studyId: string | number,
    offset = 0,
    limit = COMMENTS_PAGE_SIZE,
  ): Promise<StudyCommentsSummary> => {
    const url = `${await urlFor(studyId)}?limit=${limit}&offset=${offset}`
    return (await fetchGet<StudyCommentsSummary>(url, Config.authOpts())).data
  },
  postComment: async (studyId: string | number, rating: number, commentText: string): Promise<StudyComment> =>
    (await fetchPost<StudyComment>(await urlFor(studyId), { rating, commentText }, Config.authOpts())).data,
  deleteComment: async (studyId: string | number, commentId: number): Promise<void> => {
    await fetchDelete<void>(`${await urlFor(studyId)}/${commentId}`, Config.authOpts())
  },
}
