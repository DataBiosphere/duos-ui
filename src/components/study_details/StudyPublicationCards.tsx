import React from 'react'
import { Card, CardContent, Grid, Link, Typography } from '@mui/material'
import { useStudyPublications } from 'src/hooks/useStudyDetailsData'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

const StudyPublicationCards = ({ studyId }: { studyId: string }) => {
  const { data = [], isPending, error } = useStudyPublications(studyId)

  return (
    <StudyPageSection id="primary-study-publications" heading="Primary Study Publications">
      <StudyQueryResult
        isPending={isPending}
        error={error}
        isEmpty={data.length === 0}
        emptyMessage="No primary study publications have been added yet."
        errorMessage="Unable to load publications."
      >
        <Grid container spacing={2}>
          {data.map((publication) => {
            // Submitter-supplied, so only a plain http(s) URL becomes a link
            const href = validateHttpUrl(publication.url)
            return (
              <Grid key={publication.publicationId || publication.title} size={{ xs: 12, md: 6 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6">
                      {href
                        ? <Link href={href} target="_blank" rel="noopener noreferrer">{publication.title}</Link>
                        : publication.title}
                    </Typography>
                    {publication.authorNames?.length > 0 && (
                      <Typography variant="body2">{publication.authorNames.join(', ')}</Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {[publication.journal, publication.publishedDate].filter(Boolean).join(' · ')}
                    </Typography>
                    {publication.doi && <Typography variant="body2">DOI: {publication.doi}</Typography>}
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudyPublicationCards
