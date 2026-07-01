import React from 'react'
import SelectableText, { TabStyleOverride } from './SelectableText'

export interface TabControlProps {
  labels: string[]
  selectedTab: string
  setSelectedTab: (label: string) => void
  isLoading?: boolean
  styleOverride?: TabStyleOverride
  isDisabled?: boolean
}

const defaultTabContainerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: 'white',
  border: '0px',
}

export default function TabControl({ labels, selectedTab, setSelectedTab, isLoading = false, styleOverride = {}, isDisabled }: Readonly<TabControlProps>) {
  // styleOverride may include:
  //  tabSelected - style when selected
  //  tabUnselected - style when not selected
  //  tabHover - style on hover (inherit to keep unchanged)
  //  tabContainer - overrides the outer container style
  const tabContainerStyle = React.useMemo<React.CSSProperties>(
    () => styleOverride.tabContainer ?? defaultTabContainerStyle,
    [styleOverride.tabContainer],
  )

  return (
    <div style={tabContainerStyle} className="tab-list">
      {labels.map(label =>
        isLoading
          ? (
              <div
                className="text-placeholder"
                key={`${label}-placeholder`}
                style={{
                  width: '23rem',
                  height: '5rem',
                  marginRight: '2rem',
                }}
              />
            )
          : (
              <SelectableText
                label={label}
                key={`${label}-button`}
                setSelected={setSelectedTab}
                selectedType={selectedTab}
                styleOverride={styleOverride}
                isDisabled={isDisabled}
              />
            ),
      )}
    </div>
  )
}
