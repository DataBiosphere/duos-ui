import React from 'react'
import { Box, Tooltip, Typography } from '@mui/material'
import BoltIcon from '@mui/icons-material/Bolt'

export const InstantApprovalBadge: React.FC = () => (
  <Tooltip title="Datasets marked with a lightning bolt are eligible for automatic, instant access approvals — your request may be approved immediately if it clearly falls within the dataset's data use terms." arrow>
    <Box
      sx={{
        'display': 'flex',
        'alignItems': 'center',
        'gap': 0.75,
        'px': 1.5,
        'py': 0.5,
        'borderRadius': 99,
        'bgcolor': 'rgba(255, 215, 0, 0.10)',
        'border': '1px solid rgba(255, 215, 0, 0.45)',
        'cursor': 'default',
        'userSelect': 'none',
        'transition': 'background-color 0.15s',
        '&:hover': {
          bgcolor: 'rgba(255, 215, 0, 0.18)',
        },
      }}
    >
      <BoltIcon sx={{ color: 'gold', fontSize: 17 }} />
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 600,
          fontSize: '1rem',
          whiteSpace: 'nowrap',
          letterSpacing: 0.2,
        }}
      >
        Instant approval eligible
      </Typography>
    </Box>
  </Tooltip>
)

export default InstantApprovalBadge
