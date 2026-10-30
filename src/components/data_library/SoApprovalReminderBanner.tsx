import React from 'react'
import { Box, Link, Typography } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

const SO_GUIDE_URL = 'https://duos.blog/help/signingofficialguide/'

export const SoApprovalReminderBanner: React.FC = () => (
  <Box
    data-cy="so-approval-reminder-banner"
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1,
      px: 1.5,
      py: 1,
      mt: 2,
      borderRadius: 1,
      bgcolor: 'rgba(13, 110, 253, 0.06)',
      border: '1px solid rgba(13, 110, 253, 0.25)',
    }}
  >
    <InfoOutlinedIcon sx={{ color: '#0d6efd', fontSize: 20, flexShrink: 0 }} />
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
      Your Signing Official must approve you or your data access request, as each DAC prefers, prior to a DAC
      reviewing your request. Learn more
      {' '}
      <Link href={SO_GUIDE_URL} target="_blank" rel="noopener noreferrer" underline="hover">here</Link>
      .
    </Typography>
  </Box>
)

export default SoApprovalReminderBanner
