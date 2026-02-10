import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { isFunction, isNil } from 'lodash'
import React from 'react'
import { Link } from 'react-router-dom'
import SignInButton from 'src/components/SignInButton.js'
import { Tab as TabItem } from 'src/components/DuosHeader'
import { DuosUser } from 'src/types/model'
import { ProfileBox } from 'src/components/navigation/ProfileBox'

type Orientation = 'horizontal' | 'vertical'

interface NavigationTabsComponentProps {
  orientation: Orientation
  makeNotifications: () => React.ReactNode
  navbarDuosIcon: React.CSSProperties
  duosLogoImage: React.CSSProperties
  DuosLogo: string
  navbarDuosText: React.CSSProperties
  currentUser: DuosUser
  signOut: () => void
  isLogged: boolean
  contactUsButton: React.ReactNode
  showRequestModal: () => void
  supportrequestModal: React.ReactNode
  tabs: TabItem[]
  initialTab: number
  initialSubTab: number
  onSubtabChange: (event: React.SyntheticEvent, newValue: number) => void
}

const styles: Record<string, React.CSSProperties> = {
  mainTab: {
    padding: '0 25px',
    fontSize: '16px',
    textTransform: 'none',
    fontFamily: 'Montserrat, sans-serif',
    minHeight: '80px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  mainTabActive: {
    padding: '0 25px',
    fontSize: '16px',
    fontFamily: 'Montserrat, sans-serif',
    minHeight: '80px',
    textTransform: 'none',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.1)',
    fontWeight: 'bold',
  },
  subTab: {
    padding: '0 25px',
    fontSize: '15px',
    textTransform: 'none',
    fontFamily: 'Montserrat, sans-serif',
    color: '#00609f',
    minHeight: '65px',
  },
  subTabActive: {
    padding: '0 25px',
    fontSize: '15px',
    textTransform: 'none',
    fontFamily: 'Montserrat, sans-serif',
    color: '#00609f',
    minHeight: '65px',
    fontWeight: 'bold',
  },
  navButton: {
    background: 'transparent',
    color: 'white',
    border: 'none',
    minHeight: '80px',
  },
}

export const NavigationTabsComponent: React.FC<NavigationTabsComponentProps> = (props) => {
  const {
    orientation,
    makeNotifications,
    navbarDuosIcon,
    duosLogoImage,
    DuosLogo,
    navbarDuosText,
    currentUser,
    signOut,
    isLogged,
    contactUsButton,
    showRequestModal,
    supportrequestModal,
    tabs,
    initialTab,
    initialSubTab,
    onSubtabChange,
  } = props

  const selectedMenuTab = initialTab
  const selectedSubTab = initialSubTab

  return (
    <div className={`navbar-logged ${orientation === 'vertical' ? 'navbar-vertical' : ''}`}>
      {makeNotifications()}
      <ul className="navbar-main">
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          {
            orientation === 'horizontal' && (
              <Link
                id="link_logo"
                to="/home"
                className="navbar-brand"
              >
                <img style={duosLogoImage} src={DuosLogo} alt="DUOS Logo" />
              </Link>
            )
          }
          {
            isLogged && (
              <Box className="duos-navigation-box" sx={{ minWidth: 0, flex: 1 }}>
                <Tabs
                  value={selectedMenuTab >= 0 ? selectedMenuTab : false}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  orientation={orientation}
                  sx={{
                    '& .MuiTabs-indicator': { background: '#2BBD9B' },
                    'minWidth': 0,
                  }}
                >
                  {tabs.map((tab, tabIndex) => (
                    <Tab
                      key={`${tab.link}_${tabIndex}`}
                      label={tab.label}
                      style={selectedMenuTab === tabIndex ? styles.mainTabActive : styles.mainTab}
                      to={{ pathname: tab.link }}
                      state={{ selectedMenuTab: tabIndex }}
                      component={Link}
                    />
                  ))}
                </Tabs>
              </Box>
            )
          }
          {
            !isLogged && (
              <ul className="navbar-public">
                <li>
                  <a
                    id="link_about"
                    className="navbar-duos-link"
                    href="https://duos.blog/aboutduos/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="navbar-duos-icon-about" style={navbarDuosIcon}></div>
                    <span style={navbarDuosText}>About</span>
                  </a>
                </li>
                <li>
                  <a
                    id="link_help"
                    className="navbar-duos-link"
                    href="https://duos.blog/help/faqs/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="navbar-duos-icon-help" style={navbarDuosIcon}></div>
                    <span style={navbarDuosText}>FAQs</span>
                  </a>
                </li>
                <li>
                  <a
                    id="link_blog"
                    className="navbar-duos-link"
                    href="https://duos.blog/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="navbar-duos-icon-newspaper" style={navbarDuosIcon}></div>
                    <span style={navbarDuosText}>Blog</span>
                  </a>
                </li>
                {contactUsButton}
                {supportrequestModal}
                {/* Sign-in button location when window is narrow and menu is vertical */}
                {!isLogged && orientation === 'vertical' && (
                  <li style={{ marginRight: 0 }}>
                    <SignInButton />
                  </li>
                )}
              </ul>
            )
          }
        </div>
        {/* Navbar right side */}
        {/* Sign-in button location when window is wider and menu is not vertical */}
        {!isLogged && orientation !== 'vertical'
          && (
            <div
              style={{
                minWidth: '185px',
                display: 'flex',
                alignItems: 'center',
                flexDirection: orientation === 'horizontal' ? 'row' : 'column',
              }}
            >
              <SignInButton />
            </div>
          )}
        {isLogged && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexDirection: orientation === 'vertical' ? 'column' : 'row',
            }}
          >
            <a
              href="https://duos.blog/help/"
              id="blog-support-docs-link"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'white', paddingTop: 30, paddingBottom: 30, paddingLeft: 2, paddingRight: 2, marginRight: 20 }}
            >
              Help
            </a>
            <button onClick={showRequestModal} style={styles.navButton}>
              <div id="help" style={{ whiteSpace: 'nowrap' }}>Contact Us</div>
            </button>
            {supportrequestModal}
            <ProfileBox
              currentUser={currentUser}
              signOut={signOut}
              onSubtabChange={onSubtabChange}
              orientation={orientation}
              menuWidth={180}
            />
          </div>
        )}
      </ul>

      {/* Sub Tabs - only show if a valid subtab is selected */}
      {tabs[selectedMenuTab as number]?.children && selectedSubTab >= 0 && (
        <Box className="duos-navigation-box navbar-sub">
          <Tabs
            value={selectedSubTab >= 0 ? selectedSubTab : false}
            variant="scrollable"
            scrollButtons="auto"
            orientation={orientation}
            sx={{ '& .MuiTabs-indicator': { background: '#00609f' } }}
            onChange={onSubtabChange}
          >
            {tabs[selectedMenuTab as number].children?.map((tab, tabIndex) => {
              // Default to displaying the sub tab if no render function exists for it
              const isRendered = (!isFunction(tab.isRendered) || isNil(tab.isRendered(currentUser))) ? true : tab.isRendered(currentUser)
              const isRenderedForUser = (!isFunction(tab.isRenderedForUser) || isNil(tab.isRenderedForUser(currentUser)))
                ? true
                : tab.isRenderedForUser(currentUser)
              return (isRendered && isRenderedForUser)
                ? (
                    <Tab
                      key={`${tab.link}_${tabIndex}`}
                      label={tab.label}
                      style={selectedSubTab === tabIndex ? styles.subTabActive : styles.subTab}
                      to={{ pathname: tab.link }}
                      state={{ selectedMenuTab: selectedMenuTab }}
                      component={Link}
                    />
                  )
                : null
            })}
          </Tabs>
        </Box>
      )}
    </div>
  )
}
