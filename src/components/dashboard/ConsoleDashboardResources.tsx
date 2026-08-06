import React, { useState } from 'react'
import { Link, useLocation } from 'react-router'
import OpenInNewOutlinedIcon from '@mui/icons-material/OpenInNewOutlined'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'

export interface ConsoleDashboardResource {
  icon: React.ComponentType
  label: string
  description: string
  // Exactly one of these should be set: `href` for an external link (opens in a
  // new tab), `to` for in-app navigation, or `action: 'contactUs'` to open the
  // support request modal instead of navigating anywhere.
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
  const location = useLocation()
  const [showContactModal, setShowContactModal] = useState<boolean>(false)

  return (
    <>
      <style>
        {`
        .console-dashboard-section-heading {
          font-family: Montserrat, sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #1F3B50;
          max-width: 900px;
          margin: 3rem auto 1rem;
        }
        .console-dashboard-resource-link {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          width: 100%;
          background: #ffffff;
          border: 1.5px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          box-sizing: border-box;
          text-decoration: none;
          text-align: left;
          font: inherit;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .console-dashboard-resource-link:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.13);
          border-color: rgba(0, 0, 0, 0.18);
        }
        .console-dashboard-resource-label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: Montserrat, sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #1F3B50;
          margin: 0 0 0.3rem;
        }
        .console-dashboard-resource-label svg {
          font-size: 16px;
          color: #9ca3af;
        }
        .console-dashboard-resource-description {
          font-family: Montserrat, sans-serif;
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        `}
      </style>
      <h2 className="console-dashboard-section-heading">{heading}</h2>
      <div className="console-dashboard-grid">
        {resources.map((resource) => {
          const Icon = resource.icon
          const content = (
            <>
              <span className="console-dashboard-tile-icon-wrap">
                <Icon />
              </span>
              <span>
                <p className="console-dashboard-resource-label">
                  {resource.label}
                  {resource.href && <OpenInNewOutlinedIcon />}
                </p>
                <p className="console-dashboard-resource-description">{resource.description}</p>
              </span>
            </>
          )

          if (resource.action === 'contactUs') {
            return (
              <button
                key={resource.label}
                type="button"
                className="console-dashboard-resource-link"
                onClick={() => setShowContactModal(true)}
              >
                {content}
              </button>
            )
          }

          if (resource.to) {
            return (
              <Link key={resource.label} to={resource.to} className="console-dashboard-resource-link">
                {content}
              </Link>
            )
          }

          return (
            <a
              key={resource.label}
              href={resource.href}
              target="_blank"
              rel="noreferrer"
              className="console-dashboard-resource-link"
            >
              {content}
            </a>
          )
        })}
      </div>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={location.pathname}
      />
    </>
  )
}
