import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Link, Stack, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useStudyResearchOutputs } from 'src/hooks/useStudyDetailsData'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import StudyPageSection from './StudyPageSection'
import StudyQueryResult from './StudyQueryResult'

interface OutputItem {
  title: string
  url?: string
}

const Group = ({ title, items }: { title: string, items: OutputItem[] }) => (
  <Accordion disableGutters>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography sx={{ fontWeight: 600 }}>{title} ({items.length})</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {items.length === 0
        ? <Typography color="text.secondary">No {title.toLowerCase()} reported yet.</Typography>
        : (
            <Stack component="ul" spacing={1} sx={{ m: 0 }}>
              {items.map((item, index) => {
                // Submitter-supplied, so only a plain http(s) URL becomes a link
                const href = validateHttpUrl(item.url)
                return (
                  <Typography component="li" key={`${item.title}-${index}`}>
                    {href
                      ? <Link href={href} target="_blank" rel="noopener noreferrer">{item.title}</Link>
                      : item.title}
                  </Typography>
                )
              })}
            </Stack>
          )}
    </AccordionDetails>
  </Accordion>
)

const StudySecondaryResearchOutputs = ({ studyId }: { studyId: string }) => {
  const { data, isPending, error } = useStudyResearchOutputs(studyId)

  return (
    <StudyPageSection id="secondary-research-outputs" heading="Secondary Research Outputs">
      <StudyQueryResult
        isPending={isPending}
        error={error}
        errorMessage="Unable to load secondary research outputs."
      >
        <Stack>
          <Group title="Presentations" items={data?.presentations ?? []} />
          <Group title="Publications" items={data?.publications ?? []} />
          <Group title="Intellectual Property" items={data?.intellectualProperties ?? []} />
        </Stack>
      </StudyQueryResult>
    </StudyPageSection>
  )
}

export default StudySecondaryResearchOutputs
