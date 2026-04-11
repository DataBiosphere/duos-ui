import React from 'react'
import { Box, Typography } from '@mui/material'

const FONT = 'Montserrat'

interface LegendItem {
  bg: string
  border: string
  label: string
}

const LEGEND_ITEMS: LegendItem[] = [
  { bg: '#f0fdf4', border: '#bbf7d0', label: 'Pre-authorized' },
  { bg: '#fafafa', border: '#e5e7eb', label: 'Not pre-authorized' },
]

export default function ResearcherViewLegend() {
  return (
    <Box
      data-cy="researcher-view-legend"
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
    >
      {LEGEND_ITEMS.map(item => (
        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: 0.5,
              bgcolor: item.bg,
              border: `1px solid ${item.border}`,
            }}
          />
          <Typography sx={{ fontFamily: FONT, fontSize: 11, color: '#666' }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
