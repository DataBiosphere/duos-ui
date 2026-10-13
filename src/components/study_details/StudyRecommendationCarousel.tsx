import React from 'react'
import { Box } from '@mui/material'
import StudyCard from 'src/components/data_library/StudyCard'
import { StudyCardData } from 'src/types/library'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

interface Props {
  id: string
  heading: string
  studies?: StudyCardData[]
  /** True only until the first response lands, so a background refetch keeps the cards on screen */
  isPending: boolean
  error?: unknown
}

/**
 * A responsive grid of recommended studies, as the Data Library's Studies tab cards. Every
 * recommendation renders, wrapping onto further rows; there is no horizontal scrolling or
 * next/previous affordance. Nothing to select into here, so the cards carry no checkbox.
 */
const StudyRecommendationCarousel = ({ id, heading, studies, isPending, error }: Props) => {
  return (
    <StudyPageSection id={id} heading={heading}>
      <StudyQueryResult
        isPending={isPending}
        // Keyed on whether anything has loaded, not on the list being empty. A study with no
        // recommendations has loaded successfully; testing length alone flipped it from "none yet"
        // to an error banner as soon as a background refetch failed. No `= []` default on the prop,
        // because that would erase the distinction before it reaches here.
        error={studies === undefined ? error : undefined}
        isEmpty={studies?.length === 0}
        emptyMessage="No study recommendations yet."
        errorMessage="Unable to load study recommendations."
      >
        {/* The Studies tab's columns, stepped down a breakpoint: this sits beside the sidebar. */}
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
              xl: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          {(studies ?? []).map(study => <StudyCard key={study.studyId} study={study} />)}
        </Box>
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyRecommendationCarousel
