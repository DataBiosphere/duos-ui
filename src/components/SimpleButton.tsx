import React, { useState, useEffect } from 'react'

interface UpdateStyleParams {
  backgroundColor: string
  fontColor: string
  additionalStyle?: React.CSSProperties
  pointerBool: boolean
  disabled?: boolean
  setStyle: React.Dispatch<React.SetStateAction<React.CSSProperties>>
}

export interface HoverStyle {
  backgroundColor?: string
  color?: string
}

export interface SimpleButtonProps {
  onClick: () => void
  label: string
  disabled?: boolean
  baseColor?: string
  backgroundColor?: string
  fontColor?: string
  additionalStyle?: React.CSSProperties
  keyProp?: string
  hoverStyle?: HoverStyle
}

const updateStyle = ({ backgroundColor, fontColor, additionalStyle = {}, pointerBool, disabled, setStyle }: UpdateStyleParams) => {
  const baseStyle: React.CSSProperties = {
    color: fontColor,
    backgroundColor,
    border: `1px ${backgroundColor} solid`,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    padding: '5% 10%',
    cursor: pointerBool ? 'pointer' : 'default',
    textTransform: 'uppercase',
  }
  const newStyle: React.CSSProperties = { ...baseStyle, ...additionalStyle }
  if (disabled) {
    newStyle.opacity = 0.5
  }
  setStyle(newStyle)
}

export default function SimpleButton({ onClick, label, disabled, baseColor, backgroundColor: bgProp, fontColor: fontProp, additionalStyle, keyProp, hoverStyle = {} }: Readonly<SimpleButtonProps>) {
  const backgroundColor = bgProp ?? baseColor ?? 'rgb(0, 96, 159)'
  const fontColor = fontProp ?? 'white'
  const keyId = keyProp ?? `${label}-button`
  const [style, setStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    updateStyle({ backgroundColor, fontColor, additionalStyle, pointerBool: false, disabled, setStyle })
  }, [baseColor, additionalStyle, disabled, fontColor, backgroundColor])

  return (
    <button
      id={keyId}
      style={style}
      onClick={() => { if (!disabled) onClick() }}
      onMouseEnter={() => { if (!disabled) updateStyle({ backgroundColor: hoverStyle.backgroundColor ?? backgroundColor, fontColor: hoverStyle.color ?? fontColor, additionalStyle, pointerBool: true, disabled, setStyle }) }}
      onMouseLeave={() => { if (!disabled) updateStyle({ backgroundColor, fontColor, additionalStyle, pointerBool: false, disabled, setStyle }) }}
    >
      {label}
    </button>
  )
}
