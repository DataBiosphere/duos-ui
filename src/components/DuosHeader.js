import {Component, useEffect, useState} from 'react';
import {a, button, div, h, img, li, nav, small, span, ul} from 'react-hyperscript-helpers';
import Drawer from '@mui/material/Drawer';
import Hidden from '@mui/material/Hidden';
import {IconButton} from '@mui/material';
import { withStyles } from 'tss-react/mui';
import MenuIcon from '@mui/icons-material/Menu';
import {Link, withRouter} from 'react-router-dom';
import {Storage} from '../libs/storage';
import {SupportRequestModal} from './modals/SupportRequestModal';
import './DuosHeader.css';
import { NotificationService } from '../libs/notificationService';
import { Notification } from './Notification';
import DuosLogo from '../images/duos-network-logo.svg';
import contactUsHover from '../images/navbar_icon_contact_us_hover.svg';
import contactUsStandard from '../images/navbar_icon_contact_us.svg';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import {checkEnv, envGroups} from '../utils/EnvironmentUtils';
import {isFunction, isNil} from 'lodash/fp';

const styles = {
  drawerPaper: {
    backgroundColor: '#FFF',
    color: 'white',
    fontFamily: 'Montserrat'
  },
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
    fontFamily: '\'Montserrat\', sans-serif',
    minHeight: '80px',
    textTransform: 'none',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.1)',
    fontWeight: 'bold'
  },
  subTab: {
    padding: '0 25px',
    fontSize: '15px',
    textTransform: 'none',
    fontFamily: '\'Montserrat\', sans-serif',
    color: '#00609f',
    minHeight: '65px'
  },
  subTabActive: {
    padding: '0 25px',
    fontSize: '15px',
    textTransform: 'none',
    fontFamily: '\'Montserrat\', sans-serif',
    color: '#00609f',
    minHeight: '65px',
    fontWeight: 'bold'
  },
  navButton: {
    background: 'transparent',
    color: 'white',
    border: 'none',
    minHeight: '80px'
  }
};

const isOnlySigningOfficial = (user) => {
  return user.isSigningOfficial && !(user.isAdmin || user.isChairPerson || user.isMember || user.isDataSubmitter);
};

/**
 * Tab objects in this array support an `isRendered` function per top level Tab as well as
 * an optional `isRendered` (defaults to `true`) function for each sub-tab in `children`
 */
export const headerTabsConfig = [
  {
    label: 'Admin Console',
    link: '/admin_manage_dar_collections',
    children: [
      { label: 'DAR Requests', link: '/admin_manage_dar_collections' },
      { label: 'Dataset Catalog', link: '/dataset_catalog' },
      { label: 'DACs', link: '/manage_dac' },
      { label: 'Statistics', link: '/summary_votes' },
      { label: 'Users', link: '/admin_manage_users' },
      { label: 'Institutions', link: '/admin_manage_institutions' },
      { label: 'Library Cards', link: '/admin_manage_lc' }
    ],
    isRendered: (user) => user.isAdmin
  },
  {
    label: 'SO Console',
    link: '/signing_official_console/researchers',
    children: [
      { label: 'Researchers', link: '/signing_official_console/researchers' },
      { label: 'DAR Requests', link: '/signing_official_console/dar_requests' },
      { label: 'Data Submitters', link: '/signing_official_console/data_submitters', isRendered: () => checkEnv(envGroups.NON_STAGING) },
      { label: 'My Datasets', link: '/dataset_catalog' }
    ],
    isRendered: (user) => user.isSigningOfficial
  },
  {
    label: 'DAC Chair Console',
    link: '/chair_console',
    search: 'chair_console',
    children: [
      { label: 'DAR Requests', link: '/chair_console' },
      { label: 'Datasets', link: '/dataset_catalog' },
      { label: 'DAC Members', link: '/manage_dac' },
      { label: "My DAC's Datasets", link: '/dac_datasets' }
    ],
    isRendered: (user) => user.isChairPerson
  },
  {
    label: 'DAC Member Console',
    link: '/member_console',
    search: 'member_console',
    children: [
      { label: 'DAR Requests', link: '/member_console' },
      { label: 'Datasets', link: '/dataset_catalog' },
    ],
    isRendered: (user) => user.isMember
  },
  {
    label: 'DS Console',
    link: '/data_submitter_console',
    search: 'data_submitter_console',
    children: [
      { label: 'My Submitted Datasets', link: '/data_submitter_console' }
    ],
    isRendered: (user) => user.isDataSubmitter
  },
  {
    label: 'Researcher Console',
    link: '/dataset_catalog',
    search: 'dataset_catalog',
    children: [
      { label: 'Data Catalog', link: '/dataset_catalog' },
      { label: 'DAR Requests', link: '/researcher_console' }
    ],
    isRendered: (user) => user.isResearcher && !isOnlySigningOfficial(user)
  }
];

const NavigationTabsComponent = (props) => {
  const {
    orientation,
    makeNotifications,
    navbarDuosIcon, duosLogoImage, DuosLogo, navbarDuosText,
    currentUser, signOut, isLogged,
    contactUsButton, showRequestModal, supportrequestModal,
    tabs, initialTab, initialSubTab,
    onSubtabChange
  } = props;
  const [selectedMenuTab, setSelectedMenuTab] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState(false);

  useEffect(() => {
    setSelectedMenuTab(initialTab === -1 ? false : initialTab);
    setSelectedSubTab(initialSubTab === -1 ? false : initialSubTab);
  }, [initialTab, initialSubTab]);

  return (div({
    className: `navbar-logged ${orientation === 'vertical' ? 'navbar-vertical' : ''}`
  }, [
    makeNotifications(),
    ul({ className: 'navbar-main' }, [
      div({ style: { width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' } }, [
        h(Link, {
          isRendered: orientation === 'horizontal',
          id: 'link_logo',
          to: '/home',
          className: 'navbar-brand'
        }, [
          img({ style: duosLogoImage, src: DuosLogo, alt: 'DUOS Logo' }),
        ]),
        h(Box, { isRendered: isLogged, className: 'duos-navigation-box' }, [
          h(Tabs, {
            value: selectedMenuTab,
            variant: 'scrollable',
            scrollButtons: 'auto',
            orientation,
            TabIndicatorProps: {
              style: { background: '#2BBD9B' }
            }
          }, tabs.map((tab, tabIndex) => {
            return h(Tab, {
              key: `${tab.link}_${tabIndex}`,
              label: tab.label,
              style: selectedMenuTab === tabIndex ? styles.mainTabActive : styles.mainTab,
              to: {
                pathname: tab.link,
                state: {
                  selectedMenuTab: tabIndex,
                },
              },
              component: Link
            });
          }))
        ]),
        ul({ isRendered: !isLogged, className: 'navbar-public' }, [
          li({}, [
            a(
              {
                id: 'link_about',
                className: 'navbar-duos-link',
                href: 'https://broad-duos.zendesk.com/hc/en-us/articles/360060400311-About-DUOS',
                target: '_blank',
              },
              [
                div({
                  className: 'navbar-duos-icon-about',
                  style: navbarDuosIcon,
                }),
                span({ style: navbarDuosText }, ['About']),
              ]
            ),
          ]),
          li({}, [
            a(
              {
                id: 'link_help',
                className: 'navbar-duos-link',
                href: 'https://broad-duos.zendesk.com/hc/en-us/articles/360059957092-Frequently-Asked-Questions-FAQs-',
                target: '_blank',
              },
              [
                div({
                  className: 'navbar-duos-icon-help',
                  style: navbarDuosIcon,
                }),
                span({ style: navbarDuosText }, ['FAQs']),
              ]
            ),
          ]),
          contactUsButton,
          supportrequestModal,
        ]),
      ]),

      // Navbar right side
      div({
        isRendered: isLogged,
        style: {
          display: 'flex', alignItems: 'center',
          flexDirection: orientation === 'vertical' ? 'column' : 'row'
        }
      }, [
        button({
          onClick: showRequestModal,
          style: styles.navButton
        }, [
          div({ id: 'help', style: { whiteSpace: 'nowrap' } }, [
            'Contact Us'
          ])
        ]),
        supportrequestModal,

        li({
          className: 'dropdown user-li',
          style: { listStyleType: 'none' }
        }, [
          a(
            {
              id: 'sel_user',
              role: 'button',
              className: 'dropdown-toggle',
              'data-toggle': 'dropdown',
            },
            [
              div({ id: 'dacUser' }, [
                currentUser.displayName,
                span({ className: 'caret caret-margin' }),
              ]),
              small({ id: 'dacUserMail' }, [currentUser.email]),
            ]
          ),
          ul({
            className: 'dropdown-menu navbar-dropdown',
            role: 'menu',
            style: {
              top: orientation === 'vertical' ? '-100%' : '100%'
            }
          }, [
            li([
              h(Link, {
                id: 'link_profile',
                to: '/profile',
                onClick: onSubtabChange
              }, [
                'Your Profile',
              ]),
            ]),
            li({}, [
              a({ id: 'link_signOut', onClick: signOut }, [
                'Sign out',
              ]),
            ]),
          ]),
        ]),
      ])
    ]),

    // Sub Tabs
    tabs[selectedMenuTab]?.children && h(Box, { className: 'duos-navigation-box navbar-sub' }, [
      h(Tabs, {
        value: selectedSubTab,
        variant: 'scrollable',
        scrollButtons: 'auto',
        orientation,
        TabIndicatorProps: {
          style: { background: '#00609f' }
        },
        onChange: onSubtabChange
      }, tabs[selectedMenuTab].children.map((tab, tabIndex) => {
        // Default to displaying the sub tab if no render function exists for it
        const isRendered = (!isFunction(tab.isRendered) || isNil(tab.isRendered())) ?
          true :
          tab.isRendered();
        return isRendered ? h(Tab, {
          key: `${tab.link}_${tabIndex}`,
          label: tab.label,
          style: selectedSubTab === tabIndex ? styles.subTabActive : styles.subTab,
          to: {
            pathname: tab.link,
            state: {
              selectedMenuTab: selectedMenuTab,
            },
          },
          component: Link
        }) : null;
      }))
    ])
  ]));
};

class DuosHeader extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showSupportRequestModal: false,
      hover: false,
      notificationData: [],
      openDrawer: false
    };
  }

  async componentDidMount() {
    const notificationData =  await NotificationService.getActiveBanners();
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });
  }

  toggleHover = () => {
    this.setState(prev => {
      prev.hover = !this.state.hover;
      return prev;
    });
  };

  signOut = () => {
    this.props.history.push('/home');
    this.toggleDrawer(false);
    this.props.onSignOut();
  };

  supportRequestModal = () => {
    this.setState(prev => {
      prev.showSupportRequestModal = true;
      prev.openDrawer = false;
      return prev;
    });
  };

  okSupportRequestModal = () => {
    this.setState(prev => {
      prev.showSupportRequestModal = false;
      return prev;
    });
  };

  closeSupportRequestModal = () => {
    this.setState(prev => {
      prev.showSupportRequestModal = false;
      return prev;
    });
  };

  makeNotifications = () => {
    return this.state.notificationData.map((d, index) => Notification({notificationData: d, key:index}));
  };

  toggleDrawer = (boolVal) => {
    this.setState((prev) => {
      prev.openDrawer = boolVal;
      return prev;
    });
  };

  goToLink = (link) => {
    this.props.history.push(link);
    this.toggleDrawer(false);
  };

  render() {
    const { classes, location } = this.props;

    let isLogged = Storage.userIsLogged();
    let currentUser = {};

    if (isLogged) {
      currentUser = Storage.getCurrentUser();
    }

    const duosLogoImage = {
      height: '50px',
      padding: '0',
      marginRight: 30,
      cursor: 'pointer'
    };

    const navbarDuosIcon = {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      margin: '0 8px 0 0',
      transition: 'all 0.3s ease !important',
      verticalAlign: 'baseline'
    };

    const navbarDuosText = {
      display: 'inline',
      verticalAlign: 'text-bottom'
    };

    const contactUsSource = this.state.hover ? contactUsHover : contactUsStandard;
    const contactUsIcon = isLogged ? '' : img({src: contactUsSource, style: {display: 'inline-block', margin: '0 8px 0 0', verticalAlign: 'baseline'}});
    const contactUsText = isLogged ? 'Contact Us': span({ style: navbarDuosText }, ['Contact Us']);
    const contactUsButton = button({
      id: 'btn_applyAcces',
      style: {
        color: this.state.hover ? '#2FA4E7' : '#ffffff',
        fontSize: '14px',
        fontWeight: '500',
        background: 'transparent',
        border: 'none',
        outline: 'none',
        margin: '0 20px 0 0',
        padding: '15px 0'
      },
      onMouseEnter: this.toggleHover,
      onMouseLeave: this.toggleHover,
      onClick: this.supportRequestModal,
      'data-tip': 'Need help? Contact us for some assistance', 'data-for': 'tip_requestAccess'
    }, [contactUsIcon, contactUsText]);

    const supportrequestModal = h(SupportRequestModal, {
      showModal: this.state.showSupportRequestModal,
      onOKRequest: this.okSupportRequestModal,
      onCloseRequest: this.closeSupportRequestModal,
      url: this.props.location.pathname
    });

    const tabs = headerTabsConfig.filter((data) => data.isRendered(currentUser));

    // returns true if the current page the app is on is a part of this tab
    const isValidTab = (tab) => {
      if (tab.link === location.pathname || location.pathname.includes(tab.search)) {
        return true;
      }
      if (tab.children) {
        return tab.children.some((subtab) => {
          return subtab.link === location.pathname || location.pathname.includes(subtab.search);
        });
      }
      return tab.children ? tab.children.indexOf((subtab) => subtab.link === location.pathname) !== -1 : false;
    };

    let initialSubTab = false;
    let initialTab = false;

    // note: location.state.selectedMenuTab will be populated if the user navigated
    // to the current page by clicking on a tab from the nav bar.

    // populate initialTab based on state (if valid) or by manually searching through all tabs.
    if (location?.state?.selectedMenuTab
        && tabs.length > location.state.selectedMenuTab
        && isValidTab(tabs[location.state.selectedMenuTab])) {
      initialTab = location.state.selectedMenuTab;
    } else {
      initialTab = tabs.findIndex(isValidTab);
    }

    // populate initialSubTab
    if (initialTab != -1) {
      if (tabs[initialTab].link == location.pathname) {
        initialSubTab = 0;
      } else if (tabs[initialTab].children) {
        initialSubTab = tabs[initialTab].children.findIndex((subtab) => {
          return subtab.link === location.pathname || location.pathname.includes(subtab.search);
        });
      }
    }

    return nav({ className: 'navbar-duos', role: 'navigation' }, [
      h(Hidden, { mdDown: true }, [
        div({ className: 'row no-margin', style: { width: '100%' } }, [
          //Standard navbar for medium sized displays and higher (pre-existing navbar)
          h(NavigationTabsComponent, {
            goToLink: this.goToLink,
            makeNotifications: this.makeNotifications,
            duosLogoImage, DuosLogo, navbarDuosIcon, navbarDuosText,
            currentUser, isLogged, signOut: this.signOut,
            contactUsButton, supportrequestModal,
            showRequestModal: this.supportRequestModal,
            tabs, initialTab, initialSubTab,
            orientation: 'horizontal'
          })
        ]),
      ]),
      //NOTE: old navbar style is heavily dependent on css styles with element specific styles
      //Hard to make that navbar flexible with material-ui's syntax
      //For now I will use material-ui's hidden element to selectively render the two different navbars
      //I'll look into rewriting the large navbar on a later PR
      h(Hidden, { mdUp: true }, [
        this.makeNotifications(),
        div(
          {
            className: 'navbar-main',
            style: {
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            },
          },
          [
            img({
              style: duosLogoImage,
              src: DuosLogo,
              alt: 'DUOS Logo',
              onClick: () => this.goToLink('/home'),
            }),
            h(
              IconButton,
              { id: 'collapsed-navigation-icon-button', size: 'small', onClick: () => this.toggleDrawer(true) },
              [
                h(
                  MenuIcon,
                  {
                    id: 'navbar-menu-icon',
                    style: { color: 'white', fontSize: '6rem', flex: 1 },
                    anchor: 'right',
                  },
                  []
                ),
              ]
            ),
            h(
              Drawer,
              {
                anchor: 'right',
                open: this.state.openDrawer,
                PaperProps: {
                  className: classes.drawerPaper,
                },
                className: 'navbar-duos',
                onClose: () => this.toggleDrawer(false),
              },
              [
                h(NavigationTabsComponent, {
                  goToLink: this.goToLink,
                  // Notifications are already displayed underneath the expanded drawer, no need to render them twice.
                  makeNotifications: () => {},
                  duosLogoImage, DuosLogo, navbarDuosIcon, navbarDuosText,
                  currentUser, isLogged, signOut: this.signOut,
                  contactUsButton, supportrequestModal,
                  showRequestModal: this.supportRequestModal,
                  tabs, initialTab, initialSubTab,
                  orientation: 'vertical',
                  onSubtabChange: () => {
                    this.toggleDrawer(false);
                  }
                })
              ]
            ),
          ]
        ),
        supportrequestModal,
      ]),
    ]);
  }

}

export default withRouter(withStyles(DuosHeader, styles));
