import React from 'react'
import { Box, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export const SoApprovalReminderBanner: React.FC = () => (
  <Box
    data-cy="so-approval-reminder-banner"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      px: 2,
      py: 1,
      mb: 1.5,
      borderRadius: 1,
      bgcolor: 'rgba(13, 110, 253, 0.06)',
      border: '1px solid rgba(13, 110, 253, 0.25)',
    }}
  >
    <InfoOutlinedIcon sx={{ color: '#0d6efd', fontSize: 20, flexShrink: 0 }} />
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      Data access committees require Signing Officials to approve either the researcher or individual requests before they review.
      {' '}
      Each dataset below indicates which approval model applies.
    </Typography>
  </Box>
)

export default SoApprovalReminderBanner
