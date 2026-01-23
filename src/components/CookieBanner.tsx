import React from 'react'
import CheckIcon from '@mui/icons-material/Check'
import { IconButton } from '@mui/material'
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

      <Tooltip title="Acknowledge Cookies">
        <IconButton
          edge="end"
          color="inherit"
          aria-label="Acknowledge Cookies"
          data-cy="closeButton"
          onClick={() => {
            CookieUtils.setAcknowledged()
            setVisible(false)
            props.onDismiss()
          }}
          sx={{ float: 'right', marginRight: 0, padding: '5px 0 0 0' }}
        >
          <CheckIcon />
        </IconButton>
      </Tooltip>

      <p><strong>We care about your privacy</strong></p>
      <p>
        DUOS uses cookies to enable the proper functioning and security of our website. We only use cookies
        that are strictly necessary for the site to function normally. Not allowing strictly necessary cookies
        means that the DUOS site won’t be able to operate and you won’t be able to use it. By continuing to use
        our site, you are agreeing to the use of these strictly necessary cookies. We do not sell your data to
        third-parties. To find out more, read our <Link className="banner-link" to="/privacy">privacy policy</Link> and&nbsp;
        <Link className="banner-link" to="/cookie_policy">cookie policy</Link>.
      </p>
    </div>
  )
}
