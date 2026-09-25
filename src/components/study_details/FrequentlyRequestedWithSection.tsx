import React from 'react'
import { useFrequentlyRequestedWithStudies } from 'src/hooks/useStudyDetailsData'
import StudyRecommendationCarousel from './StudyRecommendationCarousel'

/** The sibling of {@link SimilarStudiesSection}, owning its own query for the same reason. */
const FrequentlyRequestedWithSection = ({ studyId }: { studyId: string }) => {
  const frequentlyRequestedWith = useFrequentlyRequestedWithStudies(studyId)

  return (
    <StudyRecommendationCarousel
      id="frequently-requested-with"
      heading="Studies often Requested with this Study"
      studies={frequentlyRequestedWith.data}
      isPending={frequentlyRequestedWith.isPending}
      error={frequentlyRequestedWith.error}
    />
  )
}

export default FrequentlyRequestedWithSection
