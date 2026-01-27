import React, { useCallback, useState } from 'react'
import footerLogo from 'src/images/broad_logo_allwhite.png'
import { CookieBanner } from 'src/components/CookieBanner'
import { CookieUtils } from 'src/utils/CookieUtils'
import './DuosFooter.css'

function DuosFooter() {
  const baseHeight = 64 // min height of the footer without the banner
  const [bannerHeight, setBannerHeight] = useState(0)
  const [acknowledged, setAcknowledged] = useState(CookieUtils.getAcknowledged())

  const bannerRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      const banner = node.children[0] as HTMLElement
      setBannerHeight(banner?.offsetHeight ?? 0)
    }
  }, [])

  const footerHeight = () => {
    return acknowledged ? baseHeight : baseHeight + bannerHeight + 20
  }

  return (
    <>
      <div className="footer-container">
        <footer className="footer-content" style={{ minHeight: footerHeight() }}>
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
      <div ref={bannerRef}>
        <CookieBanner
          visible={!acknowledged}
          onDismiss={() => setAcknowledged(true)}
        />
      </div>
    </>
  )
}

export default DuosFooter
