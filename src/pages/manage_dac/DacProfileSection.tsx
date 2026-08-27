import React from 'react'
import { Paper, Typography } from '@mui/material'

// Values mirror .user-profile-card so the DAC and user profile pages share one card style.
const CARD_SX = {
  mt: '48px',
  p: { xs: '20px', sm: '28px 32px 32px' },
  border: '1px solid #d9e4f2',
  borderRadius: '16px',
  boxShadow: '0 10px 24px rgb(34 74 120 / 5%)',
}

const HEADING_SX = {
  m: '0 0 24px',
  color: '#01549f',
  fontSize: '20px',
  fontWeight: 600,
}

interface DacProfileSectionProps {
  title: string
  children?: React.ReactNode
}

export const DacProfileSection: React.FC<DacProfileSectionProps> = ({ title, children }) => {
  const headingId = `dac-profile-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

  return (
    <Paper component="section" elevation={0} aria-labelledby={headingId} sx={CARD_SX}>
      <Typography id={headingId} component="h1" sx={HEADING_SX}>{title}</Typography>
      {children}
    </Paper>
  )
}
