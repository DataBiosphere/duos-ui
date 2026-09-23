import React from 'react'
import { Chip, Stack } from '@mui/material'

interface AssetCount {
  singular: string
  plural: string
  count: number
}

/**
 * Counts are derived from the asset lists the page already fetches, so a badge can never
 * disagree with the section it summarizes.
 *
 * Both forms come from the caller rather than being derived by trimming an 's'. Every label here
 * happens to pluralize regularly, but a study asset that does not would read as a bug.
 */
const StudyAssetCountBadges = ({ counts }: { counts: AssetCount[] }) => {
  const badges = counts.filter(({ count }) => count > 0)
  // Nothing to count yet: render no element rather than an empty row with margin above it
  if (badges.length === 0) return null

  return (
    <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
      {badges.map(({ singular, plural, count }) => (
        <Chip size="small" key={plural} label={`${count} ${count === 1 ? singular : plural}`} />
      ))}
    </Stack>
  )
}

export default StudyAssetCountBadges
