import React from 'react'
import { Link } from 'react-router-dom'
import { CookieUtils } from 'src/utils/CookieUtils'
import Tooltip from '@mui/material/Tooltip'
import './CookieBanner.css'

export interface CookieBannerProps {
  onDismiss: () => void
  visible?: boolean
}

export const CookieBanner = (props: CookieBannerProps) => {
  const [visible, setVisible] = React.useState(props.visible)

  return (
    <div
      id="cookie_banner"
      className="banner"
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div className="banner-title-bar">
        <span className="banner-title"><strong>We care about your privacy</strong></span>
        <Tooltip title="Acknowledge Cookies">
          <button
            type="button"
            className="banner-acknowledge"
            aria-label="Acknowledge Cookies"
            onClick={() => {
              CookieUtils.setAcknowledged()
              setVisible(false)
              props.onDismiss()
            }}
          >
            Acknowledge
          </button>
        </Tooltip>
      </div>
      <div>
        DUOS uses cookies to enable the proper functioning and security of our website. We only use cookies
        that are strictly necessary for the site to function normally. Not allowing strictly necessary cookies
        means that the DUOS site won’t be able to operate and you won’t be able to use it. By continuing to use
        our site, you are agreeing to the use of these strictly necessary cookies. We do not sell your data to
        third-parties. To find out more, read our <Link className="banner-link" to="/privacy">privacy policy</Link> and&nbsp;
        <Link className="banner-link" to="/cookie_policy">cookie policy</Link>.
      </div>
    </div>
  )
}
