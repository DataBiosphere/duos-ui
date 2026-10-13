import { createContext, useContext } from 'react'

export interface TocItem { id: string, heading: string }
export interface TocContextValue { items: TocItem[], register: (item: TocItem) => void }

export const TocContext = createContext<TocContextValue>({ items: [], register: () => {} })
export const useTableOfContents = () => useContext(TocContext)
