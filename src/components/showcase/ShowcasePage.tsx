/**
 * The public showcase route (DT-4423): `/data` renders the flagship and `/showcase/:key` any other
 * live entry. It needs no session, so the routes sit outside `Authenticated`. Anything `loadShowcase`
 * refuses renders the standard not-found page.
 */
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { loadShowcase, type ShowcasePageResult, type ShowcaseRouteMatch } from 'src/components/showcase/loadShowcase'
import { ShowcaseTemplate } from 'src/components/showcase/ShowcaseTemplate'
import { useMetaDescription } from 'src/hooks/useMetaDescription'
import { useUserIsLogged } from 'src/hooks/useSession'
import { usePageTitle } from 'src/hooks/usePageTitle'
import NotFound from 'src/pages/NotFound'
import type { ShowcaseConfig } from 'src/types/showcase'

/** The hero's subtitle, when the hero is on and has one. */
const heroSubtitle = (config: ShowcaseConfig): string | undefined => {
  const hero = config.sections.hero
  return hero.enabled ? hero.subtitle : undefined
}

export interface ShowcasePageProps {
  route: ShowcaseRouteMatch['route']
}

export const ShowcasePage = ({ route }: ShowcasePageProps) => {
  const { key } = useParams()
  const match: ShowcaseRouteMatch = route === 'flagship' ? { route } : { route, key }
  const matchId = JSON.stringify(match)
  // Each answer records the match it is for, so a previous key's answer never shows for this one.
  const [loaded, setLoaded] = useState<{ matchId: string, result: ShowcasePageResult }>()

  useEffect(() => {
    let current = true
    void loadShowcase(JSON.parse(matchId) as ShowcaseRouteMatch).then((result) => {
      if (current) setLoaded({ matchId, result })
    })
    return () => {
      current = false
    }
  }, [matchId])

  // One session probe for the page; each handoff link reads the answer from context.
  const signedIn = useUserIsLogged() === true
  const result = loaded?.matchId === matchId ? loaded.result : undefined
  const found = result?.status === 'found' ? result : undefined
  usePageTitle(found?.entry.title ?? '')
  useMetaDescription(found ? heroSubtitle(found.config) : undefined)

  // Loading reads config.json, usually cached; render nothing for that moment rather than a spinner.
  if (!result) return null
  if (!found) return <NotFound />
  return <ShowcaseTemplate entry={found.entry} config={found.config} handoffs={{ enabled: found.handoffsEnabled, signedIn }} />
}
