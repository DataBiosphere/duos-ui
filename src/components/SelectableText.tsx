import React, { useState, useMemo } from 'react'

export interface TabStyleOverride {
  baseStyle?: React.CSSProperties
  tabSelected?: React.CSSProperties
  tabUnselected?: React.CSSProperties
  tabHover?: React.CSSProperties
  tabContainer?: React.CSSProperties
}

interface SelectableTextProps {
  label: string
  setSelected: (label: string) => void
  selectedType: string
  styleOverride?: TabStyleOverride
  isDisabled?: boolean
}

const defaultUnselectedStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 400,
  marginRight: '2rem',
  color: '#837f7f',
}

const defaultSelectedStyle: React.CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 400,
  borderBottomWidth: '3px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'green',
  marginRight: '2rem',
  color: '#837f7f',
}

const defaultHoverStyle: React.CSSProperties = { fontWeight: 600, cursor: 'pointer' }

const buttonReset: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  fontFamily: 'inherit',
  textAlign: 'left',
}

export default function SelectableText({ label, setSelected, selectedType, styleOverride = {}, isDisabled = false }: Readonly<SelectableTextProps>) {
  const { baseStyle, tabSelected, tabUnselected, tabHover } = styleOverride
  const [isHovered, setIsHovered] = useState(false)

  const utilizedUnselectedStyle = useMemo(
    () => ({ ...tabUnselected ?? defaultUnselectedStyle, ...baseStyle }),
    [tabUnselected, baseStyle],
  )
  const utilizedSelectedStyle = useMemo(
    () => ({ ...tabSelected ?? defaultSelectedStyle, ...baseStyle }),
    [tabSelected, baseStyle],
  )
  const utilizedHoverStyle = useMemo(
    () => ({ ...tabHover ?? defaultHoverStyle, ...baseStyle }),
    [tabHover, baseStyle],
  )

  const style = useMemo(() => {
    const stateStyle = selectedType === label ? utilizedSelectedStyle : utilizedUnselectedStyle
    // Hover layers on top of the state style so a hovered tab keeps its selected/unselected cues.
    return isHovered ? { ...stateStyle, ...utilizedHoverStyle } : stateStyle
  }, [isHovered, selectedType, label, utilizedSelectedStyle, utilizedUnselectedStyle, utilizedHoverStyle])

  return (
    <button
      type="button"
      disabled={isDisabled}
      style={{ ...buttonReset, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => setSelected(label)}
      className={`tab-selection-${label}`}
    >
      {label}
    </button>
  )
}
