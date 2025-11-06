import React from 'react'

export interface StudyAssetConfig {
  icon: string
  title: string
  description: string
  children?: React.ReactNode
  button?: React.ReactNode
}

export interface StudyAssetProps {
  config: StudyAssetConfig
}

export const StudyAsset: React.FC<StudyAssetProps> = ({ config }) => {
  const { icon, title, description, children, button } = config

  return (
    <div style={{ marginTop: '2rem', width: '100%' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '2rem',
        marginBottom: '1rem',
      }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '1rem',
          flex: 1,
        }}
        >
          <span className={icon} style={{ fontSize: '32px', flexShrink: 0 }} aria-hidden="true" />
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{description}</p>
          </div>
        </div>
        {button && <div style={{ flexShrink: 0 }}>{button}</div>}
      </div>
      <div style={{ width: '100%' }}>
        {children}
      </div>
    </div>
  )
}
