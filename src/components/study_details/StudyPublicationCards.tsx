import React, { useMemo } from 'react'
import { Card, CardContent, Grid, Link, Typography } from '@mui/material'
import { useStudyPublications } from 'src/hooks/useStudyDetailsData'
import { PublicationAsset } from 'src/types/library'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

/**
 * Pairs each publication with a stable React key.
 *
 * publicationId is submitter-supplied: often blank, and nothing stops two publications sharing
 * one, so identity falls back through the remaining identifiers to the title, and a repeat of
 * whichever wins takes an occurrence suffix. Keying by array position instead survives neither a
 * reorder nor an insertion, which is what Sonar objects to in typescript:S6479.
 */
const withKeys = (publications: PublicationAsset[]): Array<{ key: string, publication: PublicationAsset }> => {
  const seen = new Map<string, number>()
  return publications.map((publication) => {
    const identity = [publication.publicationId, publication.doi, publication.pubmedId, publication.url, publication.title]
      .map(value => value?.trim())
      .find(Boolean) ?? 'publication'
    const seenBefore = seen.get(identity) ?? 0
    seen.set(identity, seenBefore + 1)
    return { key: seenBefore === 0 ? identity : `${identity}#${seenBefore}`, publication }
  })
}

const StudyPublicationCards = ({ studyId }: { studyId: string }) => {
  const { data = [], isPending, error } = useStudyPublications(studyId)
  const cards = useMemo(() => withKeys(data), [data])

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
          {cards.map(({ key, publication }) => {
            // Submitter-supplied, so only a plain http(s) URL becomes a link
            const href = validateHttpUrl(publication.url)
            return (
              <Grid key={key} size={{ xs: 12, md: 6 }}>
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
