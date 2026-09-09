import React from 'react'
import { Chip, Stack } from '@mui/material'

/**
 * Counts are derived from the asset lists the page already fetches, so a badge can never
 * disagree with the section it summarizes.
 */
const StudyAssetCountBadges = ({ counts }: { counts: Array<[label: string, count: number]> }) => {
  const badges = counts.filter(([, count]) => count > 0)
  // Nothing to count yet: render no element rather than an empty row with margin above it
  if (badges.length === 0) return null

  return (
    <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
      {badges.map(([label, count]) => <Chip size="small" key={label} label={`${count} ${label}`} />)}
    </Stack>
  )
}

export default StudyAssetCountBadges
