import React from 'react'
import { Typography } from '@mui/material'
import { titleStyle } from './dashboardStyles'

interface ConsoleDashboardTitleProps {
  children: React.ReactNode
}

export default function ConsoleDashboardTitle({ children }: ConsoleDashboardTitleProps): React.JSX.Element {
  return <Typography component="h1" sx={titleStyle}>{children}</Typography>
}
