import React from 'react'
import { useSimilarStudies } from 'src/hooks/useStudyDetailsData'
import StudyRecommendationCarousel from './StudyRecommendationCarousel'

/**
 * Owns its query, as the other sections do, so a slow or refetching recommendation list re-renders
 * itself rather than the whole page and the datasets grid with it.
 */
const SimilarStudiesSection = ({ studyId }: { studyId: string }) => {
  const similarStudies = useSimilarStudies(studyId)

  return (
    <StudyRecommendationCarousel
      id="similar-studies"
      heading="Recommended Studies by Data Type or PI"
      recommendations={similarStudies.data}
      isPending={similarStudies.isPending}
      error={similarStudies.error}
    />
  )
}

export default SimilarStudiesSection
