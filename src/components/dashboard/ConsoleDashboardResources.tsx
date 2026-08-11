import React, { useState } from 'react'
import { Link } from 'react-router'
import { Box, Card, Typography } from '@mui/material'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { useNavigationState } from 'src/contexts/NavigationStateContext'
import {
  cardIconStyle,
  cardStyle,
  cardTitleStyle,
  descriptionStyle,
  externalIconStyle,
  gridStyle,
  headingStyle,
} from './dashboardStyles'

export interface ConsoleDashboardResource {
  icon: React.ComponentType
  label: string
  description: string
  // Set exactly one: `href` (external, new tab), `to` (in-app), or `action: 'contactUs'`
  // (opens the support modal instead of navigating).
  href?: string
  to?: string
  action?: 'contactUs'
}

interface ConsoleDashboardResourcesProps {
  heading: string
  resources: ConsoleDashboardResource[]
}

export default function ConsoleDashboardResources({
  heading,
  resources,
}: ConsoleDashboardResourcesProps): React.JSX.Element {
  const { activeTab } = useNavigationState()
  const [showContactModal, setShowContactModal] = useState(false)

  return (
    <>
      <Typography component="h2" sx={headingStyle}>{heading}</Typography>
      <Box sx={gridStyle}>
        {resources.map((resource) => {
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
        })}
      </Box>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={window.location.href}
      />
    </>
  )
}
