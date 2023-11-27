import React from 'react';
import footerLogo from '../images/broad_logo_allwhite.png';

function DuosFooter() {

  const footerStyle = {
    position: 'relative',
    clear: 'both',
    backgroundColor: '#000000',
    minHeight: '64px'
  };

  const mainFooterStyle = {
    display: 'block',
    width: '100%',
    padding: '0 20px'
  };

  const footerLogoStyle = {
    float: 'left',
    height: '32px',
    marginTop: '15px',
    marginRight: '35px'
  };

  return (
    <div style={footerStyle}>
      <footer style={mainFooterStyle}>
        <img src={footerLogo} style={footerLogoStyle} alt='Broad Institute logo' />
        <ul className='footer-links'>
          <li className='footer-links__item'>© Broad Institute</li>
          <li className='footer-links__item'><a href='/privacy'>Privacy Policy</a></li>
          <li className='footer-links__item'><a href='/tos'>Terms of Service</a></li>
          <li className='footer-links__item'><a href='/status'>Status</a></li>
        </ul>
      </footer>
    </div>
  );
}

export default DuosFooter;
