import React, { useState } from 'react'
import { Link } from 'react-router'
import { Box, Card, Typography } from '@mui/material'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { useNavigationState } from 'src/contexts/NavigationStateContext'
import { Storage } from 'src/libs/storage'
import { DuosUser } from 'src/types/model'
import { isRenderedForUser } from './useConsoleDashboardSummary'
import {
  cardIconStyle,
  cardStyle,
  cardTitleStyle,
  descriptionStyle,
  externalIconStyle,
  gridStyle,
  headingStyle,
} from './dashboardStyles'

interface ConsoleDashboardResourceBase {
  icon: React.ComponentType
  label: string
  description: string
  /**
   * Omitted means "always render". A resource whose destination is role-gated must set this,
   * or the card advertises a route that answers with Not Found.
   */
  isRenderedForUser?: (user: DuosUser) => boolean
}

/**
 * Exactly one destination per resource, enforced by the type rather than by a comment: `href`
 * (external, new tab), `to` (in-app), or `action: 'contactUs'` (opens the support modal instead
 * of navigating). A card with no destination would render as a dead `<a>` that looks identical
 * to a working one, and a card with both would promise a new tab and navigate in place.
 */
export type ConsoleDashboardResource = ConsoleDashboardResourceBase & (
  | { href: string, to?: never, action?: never }
  | { to: string, href?: never, action?: never }
  | { action: 'contactUs', href?: never, to?: never }
)

interface ConsoleDashboardResourcesProps {
  heading: string
  resources: ConsoleDashboardResource[]
  currentUser?: DuosUser
}

export default function ConsoleDashboardResources({
  heading,
  resources,
  currentUser: providedCurrentUser,
}: Readonly<ConsoleDashboardResourcesProps>): React.JSX.Element {
  const { activeTab } = useNavigationState()
  const [showContactModal, setShowContactModal] = useState(false)

  const currentUser = providedCurrentUser ?? Storage.getCurrentUser()
  const visibleResources = resources.filter(resource => isRenderedForUser(resource.isRenderedForUser, currentUser))
  // Mounting the modal where nothing can open it costs a Storage read per render for nothing.
  const hasContactUsResource = visibleResources.some(resource => resource.action === 'contactUs')

  return (
    <>
      <Typography component="h2" sx={headingStyle}>{heading}</Typography>
      <Box sx={gridStyle}>
        {visibleResources.map((resource) => {
          const Icon = resource.icon
          const content = (
            <>
              <Box component="span" sx={cardIconStyle}><Icon /></Box>
              <span>
                <Typography component="span" sx={cardTitleStyle}>
                  {resource.label}
                  {resource.href && <OpenInNewOutlinedIcon sx={externalIconStyle} />}
                </Typography>
                <Typography component="span" sx={descriptionStyle}>{resource.description}</Typography>
              </span>
            </>
          )

          if (resource.action === 'contactUs') {
            return (
              <Card
                variant="outlined"
                key={resource.label}
                component="button"
                type="button"
                onClick={() => setShowContactModal(true)}
                sx={cardStyle}
              >
                {content}
              </Card>
            )
          }

          if (resource.to) {
            return (
              <Card
                variant="outlined"
                key={resource.label}
                component={Link}
                to={resource.to}
                state={{ selectedMenuTab: activeTab }}
                sx={cardStyle}
              >
                {content}
              </Card>
            )
          }

          if (resource.href) {
            return (
              <Card
                variant="outlined"
                key={resource.label}
                component="a"
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                sx={cardStyle}
              >
                {content}
              </Card>
            )
          }

          // Unreachable: the type requires one destination. Rendering nothing rather than
          // falling through to an <a> keeps a malformed resource from becoming a dead card
          // that looks identical to a working one.
          return null
        })}
      </Box>

      {hasContactUsResource && (
        <SupportRequestModal
          showModal={showContactModal}
          onCloseRequest={() => setShowContactModal(false)}
          url={window.location.href}
        />
      )}
    </>
  )
}
