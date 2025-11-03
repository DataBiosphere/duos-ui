import React, { useState } from 'react'
import footerLogo from '../images/broad_logo_allwhite.png'
import ManageCookies from 'src/components/ManageCookies.tsx'

function DuosFooter() {
  const [showCookieControl, setShowCookieControl] = useState(false)

  const footerStyle = {
    position: 'relative',
    clear: 'both',
    backgroundColor: '#000000',
    minHeight: '64px',
  }

  const mainFooterStyle = {
    display: 'block',
    width: '100%',
    padding: '0 20px',
  }

  const footerLogoStyle = {
    float: 'left',
    height: '32px',
    marginTop: '15px',
    marginRight: '35px',
  }

  return (
    <div style={footerStyle}>
      <footer style={mainFooterStyle}>
        <img src={footerLogo} style={footerLogoStyle} alt="Broad Institute logo" />
        <ul className="footer-links">
          <li className="footer-links__item">© Broad Institute</li>
          <li className="footer-links__item"><a href="/privacy">Privacy Policy</a></li>
          <li className="footer-links__item"><a href="/tos">Terms of Service</a></li>
          <li className="footer-links__item"><a href="/cookie_policy">Cookie Policy</a></li>
          <li className="footer-links__item">
            <button
              onClick={() => setShowCookieControl(true)}
              style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit' }}
              type="button"
            >
              Manage Cookies
            </button>
          </li>
          <li className="footer-links__item"><a href="/status">Status</a></li>
        </ul>
      </footer>
      {showCookieControl
        && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: 'white',
              borderRadius: '5px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              minWidth: '200px',
              maxWidth: '400px',
              zIndex: 1000,
              transition: 'all 0.3s ease',
              cursor: 'pointer',
            }}
          >
            <button
              style={{
                marginLeft: '90%',
                padding: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '20px',
              }}
              className="glyphicon glyphicon-remove"
              onClick={() => setShowCookieControl(false)}
              aria-label="Close"
              type="button"
            />
            <ManageCookies />
          </div>
        )}
    </div>
  )
}

export default DuosFooter
