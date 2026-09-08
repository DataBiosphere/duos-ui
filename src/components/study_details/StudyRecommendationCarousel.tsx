import React from 'react'
import { Card, CardActionArea, CardContent, Grid, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { StudyAggregation } from 'src/types/library'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

interface Props {
  id: string
  heading: string
  recommendations?: StudyAggregation[]
  /** True only until the first response lands, so a background refetch keeps the cards on screen */
  isPending: boolean
  error?: unknown
}

const StudyRecommendationCarousel = ({ id, heading, recommendations = [], isPending, error }: Props) => {
  const navigate = useNavigate()

  return (
    <StudyPageSection id={id} heading={heading}>
      <StudyQueryResult
        isPending={isPending}
        error={error}
        isEmpty={recommendations.length === 0}
        emptyMessage="No study recommendations yet."
        errorMessage="Unable to load study recommendations."
      >
        <Grid container spacing={2}>
          {recommendations.map(study => (
            <Grid key={study.studyId} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea sx={{ height: '100%' }} onClick={() => navigate(`/studies/${study.studyId}`)}>
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
