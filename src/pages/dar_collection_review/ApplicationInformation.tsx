import React from 'react'

const styles: Record<string, React.CSSProperties> = {
  subheader: {
    fontWeight: 800,
    fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)',
    margin: '1rem 0',
  },
  textBox: {
    marginTop: '1.5rem',
    backgroundColor: 'rgb(237 234 228)',
    padding: 'clamp(1.2rem, 2.8vw, 3rem)',
    fontSize: 'clamp(1.4rem, 2.1vw, 1.9rem)',
    overflowWrap: 'anywhere',
  },
}

export interface ApplicationInformationProps {
  nonTechSummary?: string
  rus?: string
  isLoading?: boolean
}

export default function ApplicationInformation({
  nonTechSummary,
  rus,
  isLoading = false,
}: Readonly<ApplicationInformationProps>) {
  return (
    <div className="application-information-page" style={{ padding: '2% 3%', backgroundColor: 'white' }}>
      {isLoading
        ? (
            <div
              className="text-placeholder"
              style={{ height: '4rem', width: '20%', marginBottom: '2rem' }}
            >
            </div>
          )
        : <div className="non-technical-summary-subheader" style={styles.subheader}>Non-Technical Summary</div>}
      <div className="non-technical-summary-container">
        {isLoading
          ? (
              <div
                className="text-placeholder"
                style={{ height: '18rem', width: '100%' }}
              >
              </div>
            )
          : <div className="non-technical-summary-textbox" style={styles.textBox}>{nonTechSummary}</div>}
      </div>
      {isLoading
        ? (
            <div
              className="text-placeholder"
              style={{ height: '4rem', width: '20%', marginBottom: '2rem' }}
            >
            </div>
          )
        : <div className="rus-subheader" style={styles.subheader}>Research Use Statement</div>}
      <div className="rus-container">
        {isLoading
          ? <div className="text-placeholder" style={{ height: '18rem', width: '100%' }}></div>
          : <div className="rus-textbox" style={styles.textBox}>{rus}</div>}
      </div>
    </div>
  )
}
