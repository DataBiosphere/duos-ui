import React, { useCallback, useMemo, useState } from 'react'
import { Link, Stack, Typography } from '@mui/material'
import { TocContext, TocItem, useTableOfContents } from './TableOfContentsContext'

export const TocProvider = ({ children }: React.PropsWithChildren) => {
  const [items, setItems] = useState<TocItem[]>([])
  const register = useCallback((item: TocItem) => {
    setItems(current => current.some(({ id }) => id === item.id) ? current : [...current, item])
  }, [])
  const value = useMemo(() => ({ items, register }), [items, register])
  return <TocContext.Provider value={value}>{children}</TocContext.Provider>
}

export const TableOfContents = () => {
  const { items } = useTableOfContents()
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">On this page</Typography>
      {items.map(item => (
        <Link key={item.id} href={`#${item.id}`} underline="hover">{item.heading}</Link>
      ))}
    </Stack>
  )
}
