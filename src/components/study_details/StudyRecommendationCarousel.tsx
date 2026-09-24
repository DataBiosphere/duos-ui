import React from 'react'
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { StudyRecommendation } from 'src/types/model'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

interface Props {
  id: string
  heading: string
  recommendations?: StudyRecommendation[]
  /** True only until the first response lands, so a background refetch keeps the cards on screen */
  isPending: boolean
  error?: unknown
}

/**
 * A responsive grid of recommended studies. Every recommendation renders, wrapping onto further
 * rows; there is no horizontal scrolling or next/previous affordance.
 */
const StudyRecommendationCarousel = ({ id, heading, recommendations, isPending, error }: Props) => {
  return (
    <StudyPageSection id={id} heading={heading}>
      <StudyQueryResult
        isPending={isPending}
        // Keyed on whether anything has loaded, not on the list being empty. A study with no
        // recommendations has loaded successfully; testing length alone flipped it from "none yet"
        // to an error banner as soon as a background refetch failed. No `= []` default on the prop,
        // because that would erase the distinction before it reaches here.
        error={recommendations === undefined ? error : undefined}
        isEmpty={recommendations?.length === 0}
        emptyMessage="No study recommendations yet."
        errorMessage="Unable to load study recommendations."
      >
        <Grid container spacing={2}>
          {(recommendations ?? []).map(study => (
            <Grid key={study.studyId} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                {/* A link rather than a button that navigates imperatively, as study
                    destinations are elsewhere: a button swallows open-in-new-tab, copy link
                    address, and middle click. */}
                <CardActionArea
                  component={RouterLink}
                  to={`/studies/${study.studyId}`}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{study.studyName}</Typography>
                    {study.studyDescription && (
                      <Typography variant="body2" color="text.secondary">{study.studyDescription}</Typography>
                    )}
                    <Typography variant="caption">PI: {study.piName || 'Not provided'}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyRecommendationCarousel
