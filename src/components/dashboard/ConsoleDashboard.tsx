import React, { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { QueryKey } from '@tanstack/react-query'
import { Styles } from 'src/libs/theme'
import { Storage } from 'src/libs/storage'
import { usePageTitle } from 'src/hooks/usePageTitle'
import ConsoleDashboardGrid from './ConsoleDashboardGrid'
import ConsoleDashboardPromo from './ConsoleDashboardPromo'
import ConsoleDashboardResources, { ConsoleDashboardResource } from './ConsoleDashboardResources'
import ConsoleDashboardTitle from './ConsoleDashboardTitle'
import {
  ConsoleDashboardTileMeta,
  isRenderedForUser,
  useConsoleDashboardSummary,
} from './useConsoleDashboardSummary'

interface ConsoleDashboardProps<S> {
  consoleTitle?: string
  queryKey: QueryKey
  queryFn: () => Promise<S>
  tileMeta: ConsoleDashboardTileMeta<S>[]
  resourcesHeading: string
  resources: ConsoleDashboardResource[]
  promoParagraphs: string[]
}

/** Shared page shell and data flow for each role-specific console dashboard. */
export default function ConsoleDashboard<S>({
  consoleTitle,
  queryKey,
  queryFn,
  tileMeta,
  resourcesHeading,
  resources,
  promoParagraphs,
}: Readonly<ConsoleDashboardProps<S>>): React.JSX.Element {
  usePageTitle('Dashboard')
  const [currentUser] = useState(Storage.getCurrentUser)
  const visibleTiles = useMemo(
    () => tileMeta.filter(tile => isRenderedForUser(tile.isRenderedForUser, currentUser)),
    [currentUser, tileMeta],
  )
  const { tiles, isLoading } = useConsoleDashboardSummary(queryKey, queryFn, visibleTiles)

  return (
    <Box sx={{ ...Styles.PAGE }}>
      {consoleTitle && <ConsoleDashboardTitle>{consoleTitle}</ConsoleDashboardTitle>}

      <ConsoleDashboardGrid tiles={tiles} isLoading={isLoading} />

      <ConsoleDashboardResources
        heading={resourcesHeading}
        resources={resources}
        currentUser={currentUser}
      />

      <ConsoleDashboardPromo
        heading="Get more out of DUOS"
        paragraphs={promoParagraphs}
      />
    </Box>
  )
}
