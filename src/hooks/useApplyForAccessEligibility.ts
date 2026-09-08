import { Storage } from 'src/libs/storage'

/**
 * Active Researcher Status is a library card and nothing else: a chairperson, signing official
 * or admin who holds a card has it too, so the predicate itself never folds in a role check.
 * Single source of truth for the predicate behind every 'apply for data access' path, and for
 * the card half of the comment composer's gate — see StudyCommentsSection, which requires the
 * Researcher role on top of it because StudyCommentService checks both when a comment is posted.
 */
export const hasActiveResearcherStatus = (): boolean => Storage.getCurrentUser()?.libraryCard != null

export const useApplyForAccessEligibility = (datasetIds: number[], studyIds: number[]) => ({
  hasSelection: datasetIds.length > 0,
  hasActiveResearcherStatus: hasActiveResearcherStatus(),
  datasetText: datasetIds.length === 1 ? 'dataset' : 'datasets',
  studyText: studyIds.length === 1 ? 'study' : 'studies',
})
