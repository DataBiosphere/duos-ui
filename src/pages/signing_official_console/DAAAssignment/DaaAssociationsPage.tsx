import React, { useCallback, useEffect, useState } from 'react'
import { Tabs, Tab, Box } from '@mui/material'

import ResearcherView from './ResearcherView'
import DAAView from './DAAView'
import { User } from 'src/libs/ajax/User'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, DuosUser } from 'src/types/model'
import { UserListScope } from './types'
import { extractError } from 'src/utils/ErrorUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { usePageTitle } from 'src/hooks/usePageTitle'

const TAB_SX = {
  textTransform: 'none',
  fontSize: '15px',
  fontFamily: 'Montserrat, sans-serif',
  color: '#00609f',
  fontWeight: 'bold',
  padding: '0 25px',
} as const

const TAB_PANEL_SX = {
  backgroundColor: '#f5f5f5',
  paddingLeft: '7rem',
  paddingRight: '5rem',
  paddingTop: '2rem',
  paddingBottom: '2rem',
} as const

/**
 * Whether a user from a list response holds the Researcher role.
 *
 * Reads `roles`, not the `isResearcher` convenience flag: that flag is derived
 * by `setUserRoleStatuses` for the signed-in user only, so on a list response it
 * is absent. `roles` is what the payload actually carries — the same field the
 * admin user table reads via `formatUserRoles`.
 */
function isResearcher(user: DuosUser): boolean {
  return (user.roles ?? []).some(role => role.name === USER_ROLES.researcher)
}

/**
 * Narrows a loaded user list to the researchers the page is about.
 *
 * The `SigningOfficial` scope already returns only the researchers at the SO's
 * institution, so it is passed through untouched. The `Admin` scope returns
 * every user of every role — admins, DAC chairs, signing officials, service
 * accounts — and pre-authorization applies to none of them, so those are
 * dropped rather than listed as researcher cards with no pre-auth status.
 */
function scopeToResearchers(users: DuosUser[], scope: UserListScope): DuosUser[] {
  return scope === USER_ROLES.admin ? users.filter(isResearcher) : users
}

export interface DaaAssociationsPageProps {
  /** Page heading, also used as the document title. */
  readonly title: string
  readonly description: string
  /**
   * Which user list to load. `SigningOfficial` returns the researchers at the
   * signed-in SO's institution; `Admin` returns users across every institution,
   * narrowed to researchers by {@link scopeToResearchers}.
   */
  readonly scope: UserListScope
  /**
   * Renders the page without any control that can change a pre-authorization —
   * no per-row or bulk action buttons, and no confirmation dialogs. Implied by
   * the `Admin` scope, which is read-only by definition.
   */
  readonly readOnly?: boolean
  /**
   * Optional guidance rendered between the header and the tab bar. The SO
   * Console uses it for the Principal Investigator definition, which is only
   * relevant where pre-authorization is actually granted.
   */
  readonly helpContent?: React.ReactNode
}

/**
 * The DAA Associations page, shared by the SO Console (manage) and the Admin
 * Console (read-only, system-wide).
 *
 * Both consoles get the identical page structure — header section, Researcher
 * View / DAA View tab bar, search, legend, expand/collapse-all and accordion
 * lists. The only differences are which user list is loaded and whether the
 * mutating controls are rendered.
 */
export default function DaaAssociationsPage({
  title,
  description,
  scope,
  readOnly = false,
  helpContent,
}: Readonly<DaaAssociationsPageProps>): React.JSX.Element {
  usePageTitle(title)
  const [researchers, setResearchers] = useState<DuosUser[]>([])
  const [daas, setDaas] = useState<DAAObject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)

  // Granting and revoking is a Signing Official responsibility, so the
  // cross-institution scope cannot be paired with the mutating controls even by
  // a caller that forgets to ask for read-only.
  const isReadOnly = readOnly || scope === USER_ROLES.admin

  // An SO's list is one institution, so naming it on every row would be noise.
  // The admin list spans institutions, where it is the only way to tell two
  // similarly-named researchers apart or to narrow the list to one institution.
  const showInstitution = scope === USER_ROLES.admin

  // Every path that sets the list — the initial load and any post-mutation
  // refresh inside the views — funnels through the same narrowing.
  const handleResearchersRefresh = useCallback(
    (updated: DuosUser[]) => setResearchers(scopeToResearchers(updated, scope)),
    [scope],
  )

  useEffect(() => {
    // A scope change re-runs this effect; ignore whatever the superseded run
    // returns so a slow response cannot overwrite the current scope's data.
    let ignore = false

    const init = async () => {
      setIsLoading(true)
      try {
        // Independent requests: the page waits for the slower of the two, not both.
        const [userList, daaList] = await Promise.all([User.list(scope), DAA.getDaas()])
        if (ignore) return
        setResearchers(scopeToResearchers(userList, scope))
        // A DAA is always associated with the DAC that uploaded it, even when it is not that DAC's
        // active agreement. Anything with no DAC at all is legacy data we can ignore.
        setDaas(daaList.filter(daa => Array.isArray(daa.dacs) && daa.dacs.length > 0))
      }
      catch (error) {
        if (ignore) return
        console.error('Failed to load DAA associations page data', error)
        Notifications.showError({
          text: `Error: Unable to retrieve DAA association data from server: ${extractError(error)}`,
        })
      }
      finally {
        if (!ignore) setIsLoading(false)
      }
    }
    init()

    return () => {
      ignore = true
    }
  }, [scope])

  return (
    <div>
      <Box sx={{ paddingLeft: '4rem', maxWidth: '50%', marginBottom: '2rem' }}>
        <TableHeaderSection
          title={title}
          description={description}
        />
      </Box>
      {helpContent && (
        <Box sx={{ paddingLeft: '5rem', paddingRight: '5rem', marginBottom: '1.5rem' }}>
          {helpContent}
        </Box>
      )}
      <Box
        sx={{
          borderTop: 1,
          borderBottom: 1,
          borderColor: 'divider',
          paddingLeft: '5rem',
          paddingRight: '5rem',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_event, newValue) => setActiveTab(newValue)}
          aria-label="DAA association views"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          slotProps={{
            indicator: {
              style: { backgroundColor: '#00609f' },
            },
          }}
        >
          <Tab
            key="researcherView"
            value={0}
            label="Researcher View"
            sx={{ ...TAB_SX, marginLeft: '2rem' }}
          />
          <Tab
            key="daaView"
            value={1}
            label="DAA View"
            sx={TAB_SX}
          />
        </Tabs>
      </Box>
      {activeTab === 0 && (
        <Box sx={TAB_PANEL_SX}>
          <ResearcherView
            researchers={researchers}
            daas={daas}
            isLoading={isLoading}
            onResearchersRefresh={handleResearchersRefresh}
            scope={scope}
            readOnly={isReadOnly}
            showInstitution={showInstitution}
          />
        </Box>
      )}
      {activeTab === 1 && (
        <Box sx={TAB_PANEL_SX}>
          <DAAView
            researchers={researchers}
            daas={daas}
            isLoading={isLoading}
            onResearchersRefresh={handleResearchersRefresh}
            scope={scope}
            readOnly={isReadOnly}
            showInstitution={showInstitution}
          />
        </Box>
      )}
    </div>
  )
}
