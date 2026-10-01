import React from 'react'
import { Box, Typography } from '@mui/material'
import { statLabelStyle, statValueStyle } from 'src/components/dashboard/dashboardStyles'

export interface HeadlineFigure {
  label: string
  value: React.ReactNode
}

const rowStyle = { display: 'flex', flexWrap: 'wrap', gap: '1rem', mb: '1.5rem' }

const figureStyle = {
  minWidth: '10rem',
  padding: '1rem 1.25rem',
  border: '1.5px solid rgb(0 0 0 / 8%)',
  borderRadius: '12px',
}

export const HeadlineFigures = ({ figures }: { figures: HeadlineFigure[] }) => (
  <Box component="dl" sx={rowStyle}>
    {figures.map(({ label, value }) => (
      <Box key={label} sx={figureStyle}>
        <Typography component="dt" sx={statLabelStyle}>{label}</Typography>
        <Typography component="dd" sx={{ ...statValueStyle, m: 0, fontSize: '28px' }}>{value}</Typography>
      </Box>
    ))}
  </Box>
)
