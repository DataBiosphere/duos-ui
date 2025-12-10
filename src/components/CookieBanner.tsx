import React from 'react'
import CloseIcon from '@mui/icons-material/Close'
import { Link } from 'react-router-dom'
import { CookieUtils } from 'src/utils/CookieUtils'

export interface CookieBannerProps {
  visible?: boolean
}

export const CookieBanner = (props: CookieBannerProps) => {
  const [visible, setVisible] = React.useState(props.visible)
  return (
    <div
      id="cookie_banner"
      className="cookie-banner"
      style={{
        border: '1px solid',
        borderRadius: '5px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        display: visible ? 'block' : 'none',
      }}
    >

      <button
        type="button"
        style={{ float: 'right', fontWeight: 'bolder', fontSize: 24, cursor: 'pointer' }}
        onClick={() => {
          CookieUtils.setAccepted()
          setVisible(false)
        }}
      >
        <CloseIcon />
      </button>

      <p><strong>We care about your privacy</strong></p>
      <p>
        DUOS uses cookies to enable the proper functioning and security of our website. We only use cookies
        that are strictly necessary for the site to function normally. Not allowing strictly necessary cookies
        means that the DUOS site won’t be able to operate and you won’t be able to use it. By continuing to use
        our site, you are agreeing to the use of these strictly necessary cookies. We do not sell your data to
        third-parties. To find out more, read our <Link to="/privacy">privacy policy</Link> and&nbsp;
        <Link to="/cookie_policy">cookie policy</Link>.
      </p>
    </div>
  )
}
