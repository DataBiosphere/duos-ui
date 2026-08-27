/* oxlint-disable react-refresh/only-export-components */
import MenuIcon from '@mui/icons-material/Menu'
import { Box, IconButton } from '@mui/material'
import Drawer from '@mui/material/Drawer'
import React, { useEffect, useState } from 'react'
import { NavigationTabsComponent } from 'src/components/NavigationTabsComponent'
import { SubTab, visibleSubTabs } from 'src/components/navigation/subTabVisibility'
import DuosLogo from 'src/images/duos-network-logo.svg'
import contactUsStandard from 'src/images/navbar_icon_contact_us.svg'
import contactUsHover from 'src/images/navbar_icon_contact_us_hover.svg'
import { Auth } from 'src/libs/auth/auth'
import { Banner, NotificationService } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import { withStyles } from 'tss-react/mui'
import { SupportRequestModal } from './modals/SupportRequestModal'
import './DuosHeader.css'
import { Notification } from './Notification'
import { useLocation, useNavigate } from 'react-router'
import { DuosUser } from 'src/types/model'
import { useNavigationState } from 'src/contexts/NavigationStateContext'
import { useQueryClient } from '@tanstack/react-query'
import { useUserIsLogged } from 'src/hooks/useSession'
import { MY_INSTITUTION_LIBRARY_ROUTE, SO_CONSOLE_SECTIONS, SO_DASHBOARD_ROUTE } from 'src/pages/signing_official_console/signingOfficialConsoleRoutes'
import { RESEARCHER_CONSOLE_SECTIONS, RESEARCHER_DASHBOARD_ROUTE, RESEARCHER_DETAIL_ROUTES } from 'src/pages/researcher_console/researcherConsoleRoutes'

export type { SubTab }

export interface Tab {
  label: string
  link: string
  search?: string
  children?: SubTab[]
  isRendered: (user: DuosUser) => boolean
  /**
   * Marks a role-scoped console landing page. `Navigation.console` sends a user to the first
   * console they can see at sign-in, so the role-agnostic Data Library tab is not one.
   */
  isConsole?: boolean
}

interface DuosHeaderState {
  showSupportRequestModal: boolean
  hover: boolean
  notificationData: Banner[]
  openDrawer: boolean
  showProfileLinks: boolean
}

interface DuosHeaderProps {
  classes?: {
    drawerPaper?: string
  }
}

const styles = {
  drawerPaper: {
    backgroundColor: '#FFF',
    color: 'white',
    fontFamily: 'Montserrat',
  },
}

const isOnlySigningOfficial = (user: DuosUser): boolean => {
  return user.isSigningOfficial && !(user.isAdmin || user.isChairPerson || user.isMember || user.isDataSubmitter)
}

export const DATA_LIBRARY_ROUTE = '/datalibrary'

/**
 * Tab objects in this array support an `isRendered` function per top level Tab as well as
 * an optional `isRendered` (defaults to `true`) function for each sub-tab in `children`
 */
export const headerTabsConfig: Tab[] = [
  {
    // First in the bar and visible to every logged-in user, whatever their roles: the Data
    // Library is not owned by any console. `search` keeps the tab highlighted across the other
    // library versions (/datalibrary/anvil and friends); /datalibrary/myinstitution is the one
    // exception, and stays with the SO Console via the exact-match tier in `isExactTabMatch`.
    label: 'Data Library',
    link: DATA_LIBRARY_ROUTE,
    search: 'datalibrary',
    // Study and dataset detail pages live outside /datalibrary, but are reached from its
    // results. Keep them registered as hidden children so a direct load or refresh still
    // highlights Data Library. The trailing slashes avoid claiming Researcher Console routes
    // such as /datasets and /dataset_submissions.
    children: [
      { label: 'Study Details', link: '/studies', search: '/studies/', isRendered: () => false },
      { label: 'Dataset Details', link: '/dataset', search: '/dataset/', isRendered: () => false },
    ],
    isRendered: () => true,
  },
  {
    label: 'Admin Console',
    link: '/admin_manage_dar_collections',
    children: [
      { label: 'Data Access Requests', link: '/admin_manage_dar_collections' },
      { label: 'DACs', link: '/manage_dac' },
      { label: 'Users', link: '/admin_manage_users' },
      { label: 'Institutions', link: '/admin_manage_institutions' },
      { label: 'Library Cards', link: '/admin_manage_lc' },
      { label: 'DAA Associations', link: '/admin_daa_associations' },
    ],
    isRendered: user => user.isAdmin,
    isConsole: true,
  },
  {
    label: 'SO Console',
    link: SO_DASHBOARD_ROUTE,
    children: [
      { label: 'Dashboard', link: SO_DASHBOARD_ROUTE, hideSubTabBar: true },
      // The institution's Data Library is advertised on the Dashboard tile only, now that the
      // Data Library has a tab of its own. It stays registered so its URL still resolves here
      // rather than to that tab.
      ...SO_CONSOLE_SECTIONS.map(section =>
        section.link === MY_INSTITUTION_LIBRARY_ROUTE ? { ...section, isRendered: () => false } : section,
      ),
    ],
    isRendered: user => user.isSigningOfficial,
    isConsole: true,
  },
  {
    label: 'DAC Console',
    link: '/dac_console',
    search: 'dac_console',
    // The Dashboard is this tab's own landing page and its tiles are the only advertised route
    // to the sections below, so there is no sub-tab bar to draw. The sections are still
    // registered so links carrying the active DAC tab do not fall through to another console
    // that shares the same route.
    children: [
      { label: 'Data Access Requests', link: '/dac_console_dar_requests', isRendered: () => false },
      { label: 'DAC Datasets', link: '/dac_datasets', isRendered: () => false },
    ],
    isRendered: user => user.isChairPerson || user.isMember,
    isConsole: true,
  },
  {
    label: 'Researcher Console',
    // Lands on the Dashboard like the SO Console. `Navigation.console` sends a researcher to this
    // same `link` at sign-in, so the Dashboard is also the post-login landing page.
    link: RESEARCHER_DASHBOARD_ROUTE,
    // As with the DAC Console, the Dashboard's tiles are the only advertised route to these
    // pages, so they stay out of the sub-tab bar. They are still registered because
    // isExactTabMatch and isSearchTabMatch read the raw children: without an entry their URLs
    // match no tab at all, and the header falls back to the first console the user can see.
    // The detail routes are here for that same reason - their URLs carry an id, so only a
    // `search` fragment can claim them.
    children: [...RESEARCHER_CONSOLE_SECTIONS, ...RESEARCHER_DETAIL_ROUTES]
      .map(section => ({ ...section, isRendered: () => false })),
    isRendered: user => user.isResearcher && !isOnlySigningOfficial(user),
    isConsole: true,
  },
]

const duosLogoImage: React.CSSProperties = {
  height: '50px',
  padding: '0',
  marginRight: 30,
  cursor: 'pointer',
}

const navbarDuosIcon: React.CSSProperties = {
  display: 'inline-block',
  width: '16px',
  height: '16px',
  margin: '0 8px 0 0',
  transition: 'all 0.3s ease !important',
  verticalAlign: 'baseline',
}

const navbarDuosText: React.CSSProperties = {
  display: 'inline',
  verticalAlign: 'text-bottom',
}

const DuosHeader: React.FC<DuosHeaderProps> = (props) => {
  const { classes } = props
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState<DuosHeaderState>({
    showSupportRequestModal: false,
    hover: false,
    notificationData: [],
    openDrawer: false,
    showProfileLinks: false,
  })

  const { activeTab, setActiveTab } = useNavigationState()
  const queryClient = useQueryClient()

  useEffect(() => {
    const fetchNotificationData = async (): Promise<void> => {
      const notificationData = await NotificationService.getActiveBanners()
      setState(prev => ({
        ...prev,
        notificationData: Array.isArray(notificationData) ? notificationData : [],
      }))
    }
    void fetchNotificationData()
  }, [])

  const toggleHover = (): void => {
    setState({
      ...state,
      hover: !state.hover,
    })
  }

  const signOut = (): void => {
    // The SPA navigation covers the legacy flow, where Auth.signOut only
    // clears local state; in BFF mode Auth.signOut follows up with a full-page
    // reload to the same destination, which supersedes both of these.
    queryClient.clear()
    navigate('/home')
    toggleDrawer(false)
    void Auth.signOut('/home')
  }

  const supportRequestModal = (): void => {
    setState({
      ...state,
      showSupportRequestModal: true,
      openDrawer: false,
    })
  }

  const closeSupportRequestModal = (): void => {
    setState({
      ...state,
      showSupportRequestModal: false,
    })
  }

  const makeNotifications = (): React.ReactNode[] => {
    return state.notificationData.map((d, index) => <Notification notificationData={d} key={d.message} index={index} />)
  }

  const toggleDrawer = (boolVal: boolean): void => {
    setState({
      ...state,
      openDrawer: boolVal,
    })
  }

  const goToLink = (link: string): void => {
    navigate(link)
    toggleDrawer(false)
  }

  const isLogged = useUserIsLogged() ?? false
  let currentUser: DuosUser = {
    createDate: new Date(),
    displayName: '',
    email: '',
    emailPreference: false,
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: false,
    isSigningOfficial: false,
    roles: [],
    userId: 0,
  }

  if (isLogged) {
    currentUser = Storage.getCurrentUser()
  }

  const contactUsSource = state.hover ? contactUsHover : contactUsStandard
  const contactUsIcon = isLogged ? '' : <img src={contactUsSource} alt="Contact Us Icon" style={{ display: 'inline-block', margin: '0 8px 0 0', verticalAlign: 'baseline' }} />
  const contactUsText = isLogged ? 'Contact Us' : <span style={{ display: 'inline', verticalAlign: 'text-bottom' }}>Contact Us</span>
  const contactUsButton = (
    <button
      id="btn_applyAcces"
      style={{
        color: state.hover ? '#2FA4E7' : '#ffffff',
        fontSize: '14px',
        fontWeight: '500',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        margin: '0 20px 0 0',
        padding: '15px 0',
      }}
      onMouseEnter={toggleHover}
      onMouseLeave={toggleHover}
      onClick={supportRequestModal}
      data-tip="Need help? Contact us for some assistance"
      data-for="tip_requestAccess"
    >
      {contactUsIcon}
      {contactUsText}
    </button>
  )

  const supportModal = (
    <SupportRequestModal
      showModal={state.showSupportRequestModal}
      onCloseRequest={closeSupportRequestModal}
      url={location.pathname}
    />
  )

  const tabs = headerTabsConfig.filter(data => data.isRendered(currentUser))

  // returns true if the current URL is exactly the tab's own link or one of its children's
  const isExactTabMatch = (tab: Tab): boolean =>
    tab.link === location.pathname
    || (tab.children?.some(subtab => subtab.link === location.pathname) ?? false)

  const matchesSearch = (entry: Tab | SubTab): boolean =>
    !!entry.search && location.pathname.includes(entry.search)

  // returns true if the tab claims the current URL by a `search` fragment of its own or of a
  // sub-tab the user can actually see. That is real ownership of the URL, so it outranks the tab
  // the user happened to be on before.
  const isVisibleSearchTabMatch = (tab: Tab): boolean =>
    matchesSearch(tab) || visibleSubTabs(tab.children, currentUser).some(matchesSearch)

  // returns true if the only thing claiming the current URL is a sub-tab that is registered but
  // never listed in the bar. Those entries exist to answer "which tab owns this URL" for a cold
  // load, so they rank below the navigation context: a study opened from inside a console has to
  // leave that console highlighted rather than jump the highlight to the Data Library.
  const isHiddenSearchTabMatch = (tab: Tab): boolean => {
    const visible = visibleSubTabs(tab.children, currentUser)
    return (tab.children ?? []).some(subtab => !visible.includes(subtab) && matchesSearch(subtab))
  }

  const claimsUrl = (tab: Tab): boolean =>
    isExactTabMatch(tab) || isVisibleSearchTabMatch(tab) || isHiddenSearchTabMatch(tab)

  // Prefer an exact match over a `search` fragment match. This is what keeps
  // /datalibrary/myinstitution on the SO Console, whose section link spells that route out, rather
  // than on the Data Library tab, whose broader `search` covers every library version.
  const exactTabMatch = tabs.findIndex(isExactTabMatch)
  const urlDerivedTab = exactTabMatch >= 0 ? exactTabMatch : tabs.findIndex(isVisibleSearchTabMatch)
  const hiddenSearchTab = tabs.findIndex(isHiddenSearchTabMatch)

  // NavigationTabsComponent always sets location.state.selectedMenuTab when a tab is clicked.
  // Honour that so clicking e.g. "Researcher Console" always wins, even when the destination
  // URL is also reachable via another tab's children.
  const stateTab: number | undefined = location?.state?.selectedMenuTab

  let urlMatchedTab = urlDerivedTab
  if (stateTab != null && tabs.length > stateTab && claimsUrl(tabs[stateTab])) {
    urlMatchedTab = stateTab
  }

  // resolve the tab in priority order:
  //   1. URL match (with state from tab click taking priority over findIndex)
  //   2. Context fallback for detail pages whose URL doesn't appear in any tab config
  //   3. Hidden sub-tab registration - a cold load of a detail page, with no context to keep
  const resolvedTab = urlMatchedTab !== -1
    ? urlMatchedTab
    : (activeTab != null && tabs.length > activeTab ? activeTab : hiddenSearchTab)

  useEffect(() => {
    if (resolvedTab !== -1) {
      setActiveTab(resolvedTab)
    }
  }, [resolvedTab, setActiveTab])

  let initialSubTab: number = -1

  // The last resort below is a guess rather than a match, so it is deliberately not written back
  // to the navigation context by the effect above.
  let initialTab = resolvedTab

  // populate initialSubTab
  if (initialTab !== -1) {
    // Only consider subtabs that should be rendered for the user. Shared with the sub-tab bar so
    // this index always refers to the same list that gets rendered.
    const renderedSubtabs = visibleSubTabs(tabs[initialTab].children, currentUser)
    // Find index of matching subtab
    initialSubTab = renderedSubtabs.findIndex(
      subtab => subtab.link === location.pathname || (subtab.search && location.pathname.includes(subtab.search)),
    )
  }

  // A page that matches no tab at all, not even a hidden registration, and has no context to fall
  // back on belongs to a console, not to the role-agnostic Data Library that sits at index 0 - so
  // land on the first console the user can see. Only a user with no console roles at all falls
  // through to the first tab.
  if (initialTab === -1 && tabs.length > 0) {
    const firstConsole = tabs.findIndex(tab => tab.isConsole)
    initialTab = firstConsole >= 0 ? firstConsole : 0
  }

  return (
    <nav className="navbar-duos" role="navigation">
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <div className="row no-margin" style={{ width: '100%' }}>
          {/* Standard navbar for medium-sized displays and higher (pre-existing navbar) */}
          <NavigationTabsComponent
            makeNotifications={makeNotifications}
            duosLogoImage={duosLogoImage}
            DuosLogo={DuosLogo}
            navbarDuosIcon={navbarDuosIcon}
            navbarDuosText={navbarDuosText}
            currentUser={currentUser}
            isLogged={isLogged}
            signOut={signOut}
            contactUsButton={contactUsButton}
            supportrequestModal={supportModal}
            showRequestModal={supportRequestModal}
            tabs={tabs}
            initialTab={initialTab}
            initialSubTab={initialSubTab}
            orientation="horizontal"
            onSubtabChange={() => {}}
          />
        </div>
      </Box>
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {makeNotifications()}
        <div className="navbar-main" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => goToLink('/home')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            aria-label="Go to home page"
          >
            <img
              style={duosLogoImage}
              src={DuosLogo}
              alt="DUOS Logo"
            />
          </button>
          <IconButton id="collapsed-navigation-icon-button" size="small" onClick={() => toggleDrawer(true)} aria-label="Open navigation menu">
            <MenuIcon id="navbar-menu-icon" style={{ color: 'white', fontSize: '6rem', flex: 1 }} />
          </IconButton>
          <Drawer
            anchor="right"
            open={state.openDrawer}
            slotProps={{ paper: { className: classes?.drawerPaper } }}
            className="navbar-duos"
            onClose={() => toggleDrawer(false)}
          >
            <NavigationTabsComponent
              // Notifications are already displayed underneath the expanded drawer, no need to render them twice.
              makeNotifications={() => null}
              duosLogoImage={duosLogoImage}
              DuosLogo={DuosLogo}
              navbarDuosIcon={navbarDuosIcon}
              navbarDuosText={navbarDuosText}
              currentUser={currentUser}
              isLogged={isLogged}
              signOut={signOut}
              contactUsButton={contactUsButton}
              supportrequestModal={supportModal}
              showRequestModal={supportRequestModal}
              tabs={tabs}
              initialTab={initialTab}
              initialSubTab={initialSubTab}
              orientation="vertical"
              onSubtabChange={() => toggleDrawer(false)}
            />
          </Drawer>
        </div>
        {supportModal}
      </Box>
    </nav>
  )
}

const StyledDuosHeader = withStyles(DuosHeader, styles)

export default StyledDuosHeader
