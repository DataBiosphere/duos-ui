import React from 'react'
import footerLogo from 'src/images/broad_logo_allwhite.png'
import { CookieBanner } from 'src/components/CookieBanner'
import { CookieUtils } from 'src/utils/CookieUtils'
import './DuosFooter.css'

function DuosFooter() {
  return (
    <>
      <div className="footer-container" style={{ minHeight: CookieUtils.getAcknowledged() ? 64 : 225 }}>
        <footer className="footer-content">
          <img src={footerLogo} className="footer-logo" alt="Broad Institute logo" />
          <ul className="footer-links">
            <li className="footer-links-item">© Broad Institute</li>
            <li className="footer-links-item"><a href="/privacy">Privacy Policy</a></li>
            <li className="footer-links-item"><a href="/tos">Terms of Service</a></li>
            <li className="footer-links-item"><a href="/cookie_policy">Cookie Policy</a></li>
            <li className="footer-links-item"><a href="/status">Status</a></li>
          </ul>
        </footer>
      </div>
      <CookieBanner visible={!CookieUtils.getAcknowledged()} />
    </>
  )
}

export default DuosFooter
