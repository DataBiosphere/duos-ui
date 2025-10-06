import React from 'react'
import lockIcon from '../../images/lock-icon.png'
import { Styles } from 'src/libs/theme'

export const AdvancedFormHeading = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      width: '112%',
      marginLeft: '-6%',
      padding: '0 2.5%',
    }}
    >
      <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION as React.CSSProperties}>
        <div style={Styles.ICON_CONTAINER}>
          <img
            id="lock-icon"
            src={lockIcon}
            style={Styles.HEADER_IMG}
            alt="A cylinder representing a data set"
          />
        </div>
        <div style={Styles.HEADER_CONTAINER as React.CSSProperties}>
          <div>
            <div style={Styles.TITLE}>
              Data Submission
              <div style={Styles.MEDIUM_DESCRIPTION}>
                Submit new datasets to DUOS
              </div>
              <div />
            </div>
          </div>
        </div>
      </div>
      <div
        className="right-header-section"
        style={{ display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'right',
          width: '25%' }}
      >
        <div style={{ textAlign: 'right' }}>Have questions?
          <div>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://support.terra.bio/hc/en-us/categories/28485138480539-Managing-Data-Access-with-DUOS"
            >
              See supporting documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedFormHeading
