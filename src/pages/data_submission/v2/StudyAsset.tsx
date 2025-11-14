import React from 'react'

export interface StudyAssetConfig {
  icon: string | React.ReactNode
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
    <div
      style={{
        marginTop: '1rem',
        width: '100%',
        background: '#eaf0fa',
        borderRadius: '12px',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '2rem',
          marginTop: '1rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flex: 1,
          }}
        >
          <div>{icon}</div>
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
