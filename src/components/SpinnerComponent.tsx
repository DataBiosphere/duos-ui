import React from 'react'

export interface SpinnerComponentProps {
  loadingImage?: string
  children?: React.ReactNode
}

const divStyle: React.CSSProperties = {
  position: 'fixed',
  top: '30vh',
  left: '50vw',
  marginLeft: '-30px',
  zIndex: 10000,
}

export function SpinnerComponent({ loadingImage, children }: Readonly<SpinnerComponentProps>): React.ReactElement {
  return (
    <div style={divStyle}>
      {loadingImage && <img src={loadingImage} alt="spinner" />}
      {children}
    </div>
  )
}
