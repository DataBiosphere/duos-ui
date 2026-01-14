import MenuIcon from '@mui/icons-material/Menu'
import { Box, IconButton } from '@mui/material'
import Drawer from '@mui/material/Drawer'
import React, { useEffect, useState } from 'react'
import { NavigationTabsComponent } from 'src/components/NavigationTabsComponent.jsx'
import DuosLogo from 'src/images/duos-network-logo.svg'
import contactUsStandard from 'src/images/navbar_icon_contact_us.svg'
import contactUsHover from 'src/images/navbar_icon_contact_us_hover.svg'
import { Auth } from 'src/libs/auth/auth'
import { NotificationService } from 'src/libs/notificationService'
import { Storage } from 'src/libs/storage'
import { DAAUtils } from 'src/utils/DAAUtils'
import { withStyles } from 'tss-react/mui'
import { SupportRequestModal } from './modals/SupportRequestModal'
import './DuosHeader.css'
import { Notification } from './Notification'
import { useLocation, useNavigate } from 'react-router-dom'
import { DuosUser } from 'src/types/model'

interface SubTab {
  label: string
  link: string
  search?: string
  isRendered?: (user: DuosUser) => boolean
  isRenderedForUser?: (user: DuosUser) => boolean
}

interface Tab {
  label: string
  link: string
  search?: string
  children?: SubTab[]
  isRendered: (user: DuosUser) => boolean
}

interface NotificationData {
  message: string
  level: 'info' | 'warning' | 'danger' | 'success'
}

interface DuosHeaderState {
  showSupportRequestModal: boolean
  hover: boolean
  notificationData: NotificationData[]
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

export const headerTabsConfig: Tab[] = [
  {
    label: 'Admin Console',
    link: '/admin_manage_dar_collections',
    children: [
      { label: 'DAR Requests', link: '/admin_manage_dar_collections' },
      { label: 'Data Library', link: '/datalibrary', search: 'datalibrary' },
      { label: 'DACs', link: '/manage_dac' },
      { label: 'Users', link: '/admin_manage_users' },
      { label: 'Institutions', link: '/admin_manage_institutions' },
      { label: 'Library Cards', link: '/admin_manage_lc' },
    ],
    isRendered: user => user.isAdmin ?? false,
  },
  {
    label: 'SO Console',
    link: '/signing_official_console/library_cards',
    children: [
      { label: 'Library Cards', link: '/signing_official_console/library_cards' },
      { label: 'DAR Requests', link: '/signing_official_console/dar_requests' },
      { label: 'Data Submitters', link: '/signing_official_console/data_submitters' },
      { label: 'My Datasets', link: '/datalibrary/myinstitution' },
      { label: 'DAA Associations', link: '/signing_official_console/researchers_daa_associations', isRendered: () => DAAUtils.isEnabled() },
    ],
    isRendered: user => user.isSigningOfficial ?? false,
  },
  {
    label: 'DAC Chair Console',
    link: '/chair_console',
    search: 'chair_console',
    children: [
      { label: 'DAR Requests', link: '/chair_console' },
      { label: 'Manage DACs', link: '/manage_dac' },
      { label: 'My DAC\'s Datasets', link: '/dac_datasets' },
    ],
    isRendered: user => user.isChairPerson ?? false,
  },
  {
    label: 'DAC Member Console',
    link: '/member_console',
    search: 'member_console',
    children: [
      { label: 'DAR Requests', link: '/member_console' },
      { label: 'Data Library', link: '/datalibrary', search: 'datalibrary' },
    ],
    isRendered: user => user.isMember ?? false,
  },
  {
    label: 'Researcher Console',
    link: '/datalibrary',
    search: 'datalibrary',
    children: [
      { label: 'Data Library', link: '/datalibrary', search: 'datalibrary' },
      { label: 'DAR Requests', link: '/researcher_console' },
      { label: 'Datasets', link: '/datasets' },
      { label: 'Data Submissions', link: '/dataset_submissions', isRenderedForUser: user => user?.isDataSubmitter ?? false },
    ],
    isRendered: user => (user.isResearcher ?? false) && !isOnlySigningOfficial(user),
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

// eslint-disable-next-line react-refresh/only-export-components
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
    navigate('/home')
    toggleDrawer(false)
    void Auth.signOut()
  }

  const supportRequestModal = (): void => {
    setState({
      ...state,
      showSupportRequestModal: true,
      openDrawer: false,
    })
  }

  const profileLinks = (): void => {
    const profileState = state.showProfileLinks
    setState({
      ...state,
      showProfileLinks: !profileState,
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

  const isLogged = Storage.userIsLogged()
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

  const isValidTab = (tab: Tab): boolean => {
    if (tab.link === location.pathname || location.pathname.includes(tab.search || '')) {
      return true
    }
    if (tab.children) {
      return tab.children.some((subtab: SubTab) => {
        return subtab.link === location.pathname || location.pathname.includes(subtab.search || '')
      })
    }
    return false
  }

  let initialSubTab: number | boolean = false
  let initialTab: number | boolean

  if (location?.state?.selectedMenuTab && tabs.length > location.state.selectedMenuTab && isValidTab(tabs[location.state.selectedMenuTab])) {
    initialTab = location.state.selectedMenuTab
  }
  else {
    initialTab = tabs.findIndex(isValidTab)
  }

  if (initialTab !== -1 && typeof initialTab === 'number') {
    if (tabs[initialTab].link === location.pathname) {
      initialSubTab = 0
    }
    else if (tabs[initialTab].children) {
      initialSubTab = tabs[initialTab].children!.filter(data => data.isRendered === undefined || data.isRendered(currentUser)).findIndex((subtab: SubTab) => {
        return subtab.link === location.pathname || location.pathname.includes(subtab.search || '')
      })
    }
  }

  return (
    <nav className="navbar-duos" role="navigation">
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <div className="row no-margin" style={{ width: '100%' }}>
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
            showProfileLinks={profileLinks}
            profileState={state.showProfileLinks}
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
              makeNotifications={() => {}}
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
              showProfileLinks={profileLinks}
              profileState={state.showProfileLinks}
            />
          </Drawer>
        </div>
        {supportModal}
      </Box>
    </nav>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export default withStyles(DuosHeader, styles)
