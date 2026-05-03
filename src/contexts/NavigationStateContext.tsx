/* eslint-disable react-refresh/only-export-components */
/* this is the standard pattern for context files that export both a provider component and a hook. */
import React, { createContext, useContext, useMemo, useState } from 'react'

interface NavigationStateContextType {
  activeTab: number | undefined
  setActiveTab: (tab: number) => void
}

const NavigationStateContext = createContext<NavigationStateContextType>({
  activeTab: undefined,
  setActiveTab: () => {},
})

export const NavigationStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined)
  const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab])
  return (
    <NavigationStateContext.Provider value={value}>
      {children}
    </NavigationStateContext.Provider>
  )
}

export const useNavigationState = () => useContext(NavigationStateContext)
