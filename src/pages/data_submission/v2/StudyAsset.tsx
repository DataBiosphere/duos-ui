import React from 'react'

export interface StudyAssetConfig {
  icon: string
  title: string
  description: string
  component: React.ReactNode
}

export interface StudyAssetProps {
  config: StudyAssetConfig
}

export const StudyAsset: React.FC<StudyAssetProps> = ({ config }) => {
  const { icon, title, description, component } = config

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1rem',
      }}
      >
        <span
          className={icon}
          style={{ fontSize: '32px', flexShrink: 0 }}
          aria-hidden="true"
        />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{description}</p>
        </div>
        <div style={{ flexShrink: 0 }}>
          {component}
        </div>
      </div>
    </div>
  )
}
