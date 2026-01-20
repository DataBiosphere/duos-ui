import React from 'react'
import { useState, useMemo } from 'react'

const defaultUnselectedStyle = {
  fontSize: '1.8rem',
  fontWeight: 400,
  marginRight: '2rem',
  color: '#837f7f',
}

const defaultSelectedStyle = {
  fontSize: '1.8rem',
  fontWeight: 400,
  borderBottomWidth: '3px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'green',
  marginRight: '2rem',
  color: '#837f7f',
}

const defaultHoverStyle = { fontWeight: 600, cursor: 'pointer' }

export default function SelectableText({ label, setSelected, selectedType, styleOverride = {}, isDisabled = false }) {
  const { baseStyle, tabSelected, tabUnselected, tabHover } = styleOverride
  const [isHovered, setIsHovered] = useState(false)

  const utilizedUnselectedStyle = useMemo(() => {
    return Object.assign({}, tabUnselected || defaultUnselectedStyle, baseStyle)
  }, [tabUnselected, baseStyle])
  const utilizedSelectedStyle = useMemo(() => {
    return Object.assign({}, tabSelected || defaultSelectedStyle, baseStyle)
  }, [tabSelected, baseStyle])
  const utilizedHoverStyle = useMemo(() => {
    return Object.assign({}, tabHover || defaultHoverStyle, baseStyle)
  }, [tabHover, baseStyle])

  const style = useMemo(() => {
    if (isHovered) {
      return utilizedHoverStyle
    }
    return selectedType === label ? utilizedSelectedStyle : utilizedUnselectedStyle
  }, [isHovered, selectedType, label, utilizedSelectedStyle, utilizedUnselectedStyle, utilizedHoverStyle])

  const addHoverEffect = () => {
    setIsHovered(true)
  }
  const removeHoverEffect = () => {
    setIsHovered(false)
  }

  return (
    <div
      style={style}
      onMouseEnter={addHoverEffect}
      onMouseLeave={removeHoverEffect}
      onClick={() => !isDisabled && setSelected(label)}
      className={`tab-selection-${label}`}
    >
      {label}
    </div>
  )
}
