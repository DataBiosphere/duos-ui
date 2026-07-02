import React, { CSSProperties } from 'react'

interface PageSubHeadingProps {
  id?: string
  title: string
  description?: React.ReactNode
  imgSrc?: string
  color?: string
  iconSize?: 'none' | 'large' | 'medium'
}

const HEADING: CSSProperties = {
  width: '100%',
  margin: '20px 0 10px 0',
  position: 'relative',
}

const DESCRIPTION: CSSProperties = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '400',
}

const ICON: CSSProperties = {
  position: 'absolute',
  top: '0',
  left: '0',
  height: '40px',
}

const TITLE: CSSProperties = {
  margin: '10px 0 5px 0',
  lineBreak: 'auto',
  padding: '5px 10px 0 0',
  fontSize: '22px',
  fontWeight: '500',
}

const margins = (iconSize: PageSubHeadingProps['iconSize']): CSSProperties => {
  if (iconSize === 'none') return { marginLeft: '0' }
  if (iconSize === 'large') return { marginLeft: '55px' }
  return { marginLeft: '45px' }
}

export const PageSubHeading = (props: Readonly<PageSubHeadingProps>) => {
  const { id, imgSrc, title, description, color, iconSize } = props

  return (
    <div style={HEADING}>
      {imgSrc && <img id={`${id}_icon`} src={imgSrc} alt={title} style={ICON} />}
      <div style={margins(iconSize)}>
        <h2 id={`${id}_title`} className={`${color}-color`} style={TITLE}>
          {title}
        </h2>
        <span id={`${id}_description`} style={DESCRIPTION}>
          {description}
        </span>
      </div>
    </div>
  )
}
