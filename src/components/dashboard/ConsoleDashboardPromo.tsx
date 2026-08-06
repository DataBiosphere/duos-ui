import React, { useState } from 'react'
import { useLocation } from 'react-router'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'

interface ConsoleDashboardPromoProps {
  heading: string
  paragraphs: string[]
  buttonLabel?: string
}

export default function ConsoleDashboardPromo({
  heading,
  paragraphs,
  buttonLabel = 'Contact Us',
}: ConsoleDashboardPromoProps): React.JSX.Element {
  const location = useLocation()
  const [showContactModal, setShowContactModal] = useState<boolean>(false)

  return (
    <>
      <style>
        {`
        .console-dashboard-promo {
          max-width: 900px;
          margin: 1.5rem auto 2rem;
          background: #1F3B50;
          border-radius: 12px;
          padding: 2rem 2.25rem;
          box-sizing: border-box;
        }
        .console-dashboard-promo-heading {
          font-family: Montserrat, sans-serif;
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.75rem;
        }
        .console-dashboard-promo-text {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          color: #d7e2ea;
          line-height: 1.6;
          margin: 0 0 0.75rem;
        }
        .console-dashboard-promo-button {
          font-family: Montserrat, sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #1F3B50;
          background: #ffffff;
          border: none;
          border-radius: 6px;
          padding: 10px 22px;
          cursor: pointer;
          margin-top: 0.5rem;
        }
        `}
      </style>
      <div className="console-dashboard-promo">
        <p className="console-dashboard-promo-heading">{heading}</p>
        {paragraphs.map(text => (
          <p key={text} className="console-dashboard-promo-text">{text}</p>
        ))}
        <button
          type="button"
          className="console-dashboard-promo-button"
          onClick={() => setShowContactModal(true)}
        >
          {buttonLabel}
        </button>
      </div>

      <SupportRequestModal
        showModal={showContactModal}
        onCloseRequest={() => setShowContactModal(false)}
        url={location.pathname}
      />
    </>
  )
}
