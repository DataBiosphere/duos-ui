import React, { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { promoButtonStyle, promoHeadingStyle, promoStyle } from './dashboardStyles'

interface ConsoleDashboardPromoProps {
  heading: string
  paragraphs: string[]
  buttonLabel?: string
}

export default function ConsoleDashboardPromo({
  heading,
  paragraphs,
  buttonLabel = 'Contact Us',
}: Readonly<ConsoleDashboardPromoProps>): React.JSX.Element {
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <>
      <Box component="section" sx={promoStyle}>
        <Typography component="h2" sx={promoHeadingStyle}>{heading}</Typography>
        {paragraphs.map(text => <p key={text}>{text}</p>)}
        <Button type="button" onClick={() => setShowContactModal(true)} sx={promoButtonStyle}>{buttonLabel}</Button>
      </Box>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={window.location.href}
      />
    </>
  )
}
