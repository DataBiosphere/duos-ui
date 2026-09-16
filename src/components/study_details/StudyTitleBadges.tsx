import React from 'react'
import { Chip, Stack } from '@mui/material'

/**
 * The study's data types come from the study itself, not the visible page of datasets, so
 * paginating the grid doesn't change the chips under the title.
 */
const StudyTitleBadges = ({ dataTypes = [] }: { dataTypes?: string[] }) => (
  <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
    {[...new Set(dataTypes)].map(type => <Chip key={type} size="small" variant="outlined" label={type} />)}
  </Stack>
)

export default StudyTitleBadges
