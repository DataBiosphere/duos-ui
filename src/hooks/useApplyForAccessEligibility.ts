import { Storage } from 'src/libs/storage'

/**
 * Active Researcher Status is a library card and nothing else: a chairperson, signing official
 * or admin who holds a card has it too, so the predicate itself never folds in a role check.
 *
 * Single source of truth for the predicate behind every 'apply for data access' path. A caller
 * that needs more than an active card — a write the backend also gates on a role, say — checks
 * that role alongside this rather than inside it, so the two requirements stay independently
 * legible at the call site.
 */
export const hasActiveResearcherStatus = (): boolean => Storage.getCurrentUser()?.libraryCard != null

export const useApplyForAccessEligibility = (datasetIds: number[], studyIds: number[]) => ({
  hasSelection: datasetIds.length > 0,
  hasActiveResearcherStatus: hasActiveResearcherStatus(),
  datasetText: datasetIds.length === 1 ? 'dataset' : 'datasets',
  studyText: studyIds.length === 1 ? 'study' : 'studies',
})
