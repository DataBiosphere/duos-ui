import React from 'react'
import { Notification } from 'src/components/Notification'
import { Banner, dismissBanner } from 'src/libs/notificationService'

interface DismissibleBannerProps {
  banner?: Banner | null
  /** Called after the dismissal is recorded, so the page can drop the banner from its state. */
  onDismissed: () => void
}

export const DismissibleBanner = ({ banner, onDismissed }: DismissibleBannerProps) => (
  <Notification
    notificationData={banner}
    onDismiss={banner
      ? () => {
          dismissBanner(banner.id)
          onDismissed()
        }
      : undefined}
  />
)
