import React, { useEffect } from 'react'
import { Notification } from 'src/components/Notification'
import { Banner, dismissBanner, onBannerDismissed } from 'src/libs/notificationService'

interface DismissibleBannerProps {
  banner?: Banner | null
  /** Which set of dismissals this records into; the page already knows. */
  isLogged: boolean
  /** Called when this banner is dismissed, here or anywhere else it is on screen. */
  onDismissed: () => void
}

export const DismissibleBanner = ({ banner, isLogged, onDismissed }: DismissibleBannerProps) => {
  const bannerId = banner?.id
  useEffect(() => onBannerDismissed((dismissedId) => {
    if (dismissedId === bannerId) {
      onDismissed()
    }
  }), [bannerId, onDismissed])

  return (
    <Notification
      notificationData={banner}
      onDismiss={banner ? () => dismissBanner(banner.id, isLogged) : undefined}
    />
  )
}
