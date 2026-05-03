import React, { createContext, useContext, useState } from 'react'

interface NavigationStateContextType {
  activeTab: number | undefined
  setActiveTab: (tab: number | undefined) => void
}

const NavigationStateContext = createContext<NavigationStateContextType>({
  activeTab: undefined,
  setActiveTab: () => {},
})

export const NavigationStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined)
  return (
    <NavigationStateContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationStateContext.Provider>
  )
}

export const useNavigationState = () => useContext(NavigationStateContext)
