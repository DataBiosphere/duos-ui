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
const StudyRecommendationCarousel = ({ id, heading, recommendations = [], isPending, error }: Props) => {
  return (
    <StudyPageSection id={id} heading={heading}>
      <StudyQueryResult
        isPending={isPending}
        // Only when there is nothing cached to keep showing, as the asset and publication
        // sections do. Passed unconditionally it undid what isPending buys above: a failed
        // background refetch replaced cards that had loaded fine.
        error={recommendations.length === 0 ? error : undefined}
        isEmpty={recommendations.length === 0}
        emptyMessage="No study recommendations yet."
        errorMessage="Unable to load study recommendations."
      >
        <Grid container spacing={2}>
          {recommendations.map(study => (
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
