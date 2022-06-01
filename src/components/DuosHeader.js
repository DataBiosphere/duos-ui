import {Component, Fragment, useEffect, useState} from 'react';
import {a, button, div, h, img, li, nav, small, span, ul} from 'react-hyperscript-helpers';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import {IconButton, List, ListItem, Menu, MenuItem} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import {Link, withRouter} from 'react-router-dom';
import {Storage} from '../libs/storage';
import {SupportRequestModal} from './modals/SupportRequestModal';
import './DuosNavigation.css';
import { NotificationService } from '../libs/notificationService';
import { Notification } from './Notification';
import { Styles } from '../libs/theme';
import DuosLogo from '../images/duos-network-logo.svg';
import contactUsHover from '../images/navbar_icon_contact_us_hover.svg';
import contactUsStandard from '../images/navbar_icon_contact_us.svg';
import { isNil } from 'lodash/fp';
import {Config} from '../libs/config';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const styles = {
  drawerPaper: {
    backgroundColor: '#00243c',
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
  }
};

const applyPointer = (e) => {
  e.target.style.cursor = 'pointer';
};

const BasicListItem = (props) => {
  const {isRendered, targetLink, label, applyPointer, isHref, onClick} = props;

  const onMouseEnter = applyPointer;

  let attributes = {
    isRendered,
    alignItems: 'center',
    id: `menu-link-${label}`,
    style: Object.assign({color: 'white'}, Styles.NAVBAR.DRAWER_LINK),
    onMouseEnter
  };

  if(isHref) {
    attributes = {
      ...attributes,
      component: 'a',
      href: targetLink,
      target: '_blank'
    };
  } else if(!isNil(onClick)) {
    attributes = {
      ...attributes,
      onClick
    };
  } else {
    attributes = {
      ...attributes,
      component: Link,
      to: targetLink,
    };
  }

  return (
    h(ListItem, attributes, [label])
  );
};

/*
  NOTE: I've made a dropdown component for statistics, but I'm willing to get rid of and use BasicListItem
  Part of me feels like having the options as seperate items will be better for smaller devices since it'll be easier to click through
  Note: user profile was split in this manner to show how that would work out
*/
const DropdownComponent = (props) => {
  const {dropdownLinks, label, goToLink, isRendered, onMouseEnter, classes} = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const linkLabels = Object.keys(dropdownLinks);

  const MenuItemTemplates = (keys, links, onMouseEnter) => {
    return keys.map((label) => {
      const linkData = links[label];
      return h(MenuItem, {
        onClick: () => goToLink(linkData.link),
        alignItems: 'center',
        id: `menu-link-${label}`,
        isRendered: linkData.isRendered,
        style: Styles.NAVBAR.DRAWER_LINK,
        onMouseEnter
      }, [label]);
    });
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const openDropdown = (e) => {
    setAnchorEl(e.currentTarget);
  };

  const id = `${label}-menu-dropdown`;

  return (
    h(Fragment, {}, [
      h(ListItem, {
        'aria-haspopup': true,
        'aria-controls': id,
        isRendered,
        alignItems: 'center',
        style: Styles.NAVBAR.DRAWER_LINK,
        onMouseEnter,
        onClick: openDropdown
      }, [label]),
      h(Menu, {
        id,
        anchorEl,
        keepMounted: true,
        open: Boolean(anchorEl),
        onClose: handleClose,
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'left'
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'right'
        },
        MenuListProps: {
          className: classes.drawerPaper
        },
        getContentAnchorEl: null
      }, MenuItemTemplates(linkLabels, dropdownLinks, onMouseEnter))
    ])
  );
};

const NavigationTabsComponent = (props) => {
  const {
    makeNotifications, goToLink,
    navbarDuosIcon, duosLogoImage, DuosLogo, navbarDuosText,
    currentUser, signOut, isLogged,
    contactUsButton, supportrequestModal,
    tabs, initialTab, initialSubTab
  } = props;
  const [selectedMenuTab, setSelectedMenuTab] = useState(false);
  const [selectedSubTab, setSelectedSubTab] = useState(false);

  useEffect(() => {
    setSelectedMenuTab(initialTab === -1 ? false : initialTab);
    setSelectedSubTab(initialSubTab === -1 ? false : initialSubTab);
  }, [initialTab, initialSubTab]);

  return (div({
    isRendered: true, className: 'navbar-logged'
  }, [
    ul({ className: 'navbar-main' }, [
      div({ style: { width: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' } }, [
        makeNotifications(),
        h(Link, {
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
            TabIndicatorProps: {
              style: { background: '#2BBD9B' }
            }
          }, tabs.map((tab, tabIndex) => {
            return h(Tab, {
              label: tab.label,
              style: selectedMenuTab === tabIndex ? styles.mainTabActive : styles.mainTab,
              onClick: () => goToLink(tab.link)
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
      div({ isRendered: isLogged, style: { display: 'flex', alignItems: 'center' } }, [
        li({ className: 'dropdown help-li', style: { marginRight: 100, padding: 0 } }, [
          a(
            {
              id: 'sel_requestHelp',
              role: 'button',
              className: 'dropdown-toggle',
              'data-toggle': 'dropdown',
            },
            [
              div({ id: 'help', style: { whiteSpace: 'nowrap' } }, [
                'Request Help',
                span({ className: 'caret caret-margin' }),
              ])
            ]
          ),
          ul({ className: 'dropdown-menu navbar-dropdown', role: 'menu' }, [
            li([
              h(Link, { id: '', to: '/profile' }, [
                'Unknown Help',
              ]),
            ])
          ]),
        ]),

        li({ className: 'dropdown user-li' }, [
          a(
            {
              id: 'sel_dacUser',
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
          ul({ className: 'dropdown-menu navbar-dropdown', role: 'menu' }, [
            li([
              h(Link, { id: 'link_profile', to: '/profile' }, [
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
        TabIndicatorProps: {
          style: { background: '#00609f' }
        }
      }, tabs[selectedMenuTab].children.map((tab, tabIndex) => {
        return h(Tab, {
          label: tab.label,
          style: selectedMenuTab === tabIndex ? styles.subTabActive : styles.subTab,
          onClick: () => goToLink(tab.link)
        });
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
      dacChairPath: '',
      dacMemberPath: '',
      researcherPath: '',
      notificationData: [],
      openDrawer: false
    };
  }

  async componentDidMount() {
    const env = await Config.getEnv();
    if (env === 'dev') {
      this.setState({dacChairPath: '/new_chair_console'});
      this.setState({dacMemberPath: '/new_member_console'});
      this.setState({researcherPath: '/new_researcher_console'});
    } else {
      this.setState({dacChairPath: '/chair_console'});
      this.setState({dacMemberPath: '/member_console'});
      this.setState({researcherPath: '/researcher_console'});
    }
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

    let isChairPerson = false;
    let isMember = false;
    let isAdmin = false;
    let isResearcher = false;
    let isDataOwner = false;
    let isSigningOfficial = false;
    let isLogged = Storage.userIsLogged();
    let currentUser = {};

    if (isLogged) {
      currentUser = Storage.getCurrentUser();
      isChairPerson = currentUser.isChairPerson;
      isMember = currentUser.isMember;
      isAdmin = currentUser.isAdmin;
      isResearcher = currentUser.isResearcher;
      isDataOwner = currentUser.isDataOwner;
      isSigningOfficial = currentUser.isSigningOfficial;
    }

    const dropdownLinks = {
      statistics: {
        'Votes Statistics': {
          link: '/summary_votes'
        },
        'Reviewed Cases Record': {
          link: '/reviewed_cases'
        }
      },
      chair: {
        'Manage DARs': {
          link: this.state.dacChairPath
        },
        'Manage DACs': {
          link: '/manage_dac'
        }
      }
    };

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

    const supportrequestModal = SupportRequestModal({
      showModal: this.state.showSupportRequestModal,
      onOKRequest: this.okSupportRequestModal,
      onCloseRequest: this.closeSupportRequestModal,
      url: this.props.location.pathname
    });

    const tabs = [
      isAdmin && {
        label: 'Admin Console',
        link: '/admin_console',
        defaultChild: false,
        children: [
          { label: 'DAR Requests', link: '/admin_manage_dar_collections' },
          { label: 'Dataset Catalog', link: '/dataset_catalog' },
          { label: 'DACs', link: '/manage_dac' },
          { label: 'Statistics', link: '/summary_votes' },
          { label: 'Users', link: '/admin_manage_users' },
          { label: 'Institutions', link: '/admin_manage_institutions' },
          { label: 'DAR Requests', link: '/admin_manage_dar_collections' },
          { label: 'Dataset Catalog', link: '/dataset_catalog' },
          { label: 'DACs', link: '/manage_dac' },
          { label: 'Statistics', link: '/summary_votes' },
          { label: 'Users', link: '/admin_manage_users' },{ label: 'DAR Requests', link: '/admin_manage_dar_collections' },
          { label: 'Dataset Catalog', link: '/dataset_catalog' },
          { label: 'DACs', link: '/manage_dac' },
          { label: 'Statistics', link: '/summary_votes' },
          { label: 'Users', link: '/admin_manage_users' },

        ]
      },
      isSigningOfficial && {
        label: 'SO Console',
        link: '/signing_official_console'
      },
      isResearcher && {
        label: 'Researcher Console',
        link: this.state.researcherPath,
        search: 'researcher_console'
      },
      isMember && {
        label: 'DAC Member Console',
        link: this.state.dacMemberPath,
        search: 'member_console'
      },
      isChairPerson && {
        label: 'Data Owner Console',
        link: '/data_owner_console'
      }
    ].filter((data) => !!data);

    let initialSubTab = false;
    const initialTab = tabs.findIndex((tab) => {
      if (tab.link === location.pathname || location.pathname.includes(tab.search)) {
        return true;
      }
      if (tab.children) {
        initialSubTab = tab.children.findIndex((subtab) => {
          return subtab.link === location.pathname || location.pathname.includes(subtab.search);
        });

        return initialSubTab !== -1;
      }
      return tab.children ? tab.children.indexOf((subtab) => subtab.link === location.pathname) !== -1 : false;
    });

    return nav({ className: 'navbar-duos navbar-duos-new', role: 'navigation' }, [
      h(Hidden, { mdDown: true }, [
        div({ className: 'row no-margin', style: { width: '100%' } }, [
          //Standard navbar for medium sized displays and higher (pre-existing navbar)
          h(NavigationTabsComponent, {
            goToLink: this.goToLink,
            makeNotifications: this.makeNotifications,
            duosLogoImage, DuosLogo, navbarDuosIcon, navbarDuosText,
            currentUser, isLogged, signOut: this.signOut,
            contactUsButton, supportrequestModal,
            tabs, initialTab, initialSubTab
          })
        ]),
      ]),
      //NOTE: old navbar style is heavily dependent on css styles with element specific styles
      //Hard to make that navbar flexible with material-ui's syntax
      //For now I will use material-ui's hidden element to selectively render the two different navbars
      //I'll look into rewriting the large navbar on a later PR
      h(Hidden, { lgUp: true }, [
        this.makeNotifications(),
        div(
          {
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
                style: {
                  // I have to give this a ridiculous z-index value to keep the google sign in widget or register link from showing up on top
                },
                onClose: () => this.toggleDrawer(false),
              },
              [
                h(List, {}, [
                  //NOTE: create user component to show logged in status (as well as dropdown options)
                  h(BasicListItem, {
                    isRendered: isLogged,
                    applyPointer,
                    targetLink: '/profile',
                    label: 'Your Profile',
                  }),
                  h(BasicListItem, {
                    isRendered: isAdmin,
                    applyPointer,
                    targetLink: '/admin_console',
                    label: 'Admin Console',
                  }),
                  h(BasicListItem, {
                    isRendered: isSigningOfficial,
                    applyPointer,
                    targetLink: '/signing_official_console',
                    label: 'Signing Official Console',
                  }),
                  h(DropdownComponent, {
                    isRendered: isChairPerson,
                    label: 'DAC Chair Console',
                    onMouseEnter: applyPointer,
                    dropdownLinks: dropdownLinks.chair,
                    goToLink: this.goToLink,
                    classes,
                  }),
                  h(BasicListItem, {
                    isRendered: isMember,
                    applyPointer,
                    targetLink: this.state.dacMemberPath,
                    label: 'DAC Member Console',
                  }),
                  h(BasicListItem, {
                    isRendered: isResearcher,
                    applyPointer,
                    targetLink: this.state.researcherPath,
                    label: 'Researcher Console',
                  }),
                  h(BasicListItem, {
                    isRendered: isDataOwner,
                    applyPointer,
                    targetLink: '/data_owner_console',
                    label: 'Data Owner Console',
                  }),
                  h(BasicListItem, {
                    isRendered: isResearcher,
                    applyPointer,
                    targetLink: '/dar_application',
                    label: 'Request Application',
                  }),
                  h(DropdownComponent, {
                    isRendered: isAdmin,
                    label: 'Statistics',
                    onMouseEnter: applyPointer,
                    dropdownLinks: dropdownLinks.statistics,
                    goToLink: this.goToLink,
                    classes,
                  }),
                  h(BasicListItem, {
                    isRendered: isLogged,
                    applyPointer,
                    targetLink: '/dataset_catalog',
                    label: 'Dataset Catalog',
                  }),
                  h(BasicListItem, {
                    isRendered: !isLogged,
                    applyPointer,
                    targetLink:
                      'https://broad-duos.zendesk.com/hc/en-us/articles/360060400311-About-DUOS',
                    label: 'About',
                    isHref: true,
                  }),
                  h(BasicListItem, {
                    applyPointer,
                    targetLink:
                      'https://broad-duos.zendesk.com/hc/en-us/articles/360059957092-Frequently-Asked-Questions-FAQs-',
                    isHref: true,
                    label: 'FAQs',
                  }),
                  //contact us doesn't use the Basic List Item since it just makes the modal visible, which is different from the redirect functionality from basicList
                  h(
                    ListItem,
                    {
                      alignItems: 'center',
                      onMouseEnter: applyPointer,
                      style: Styles.NAVBAR.DRAWER_LINK,
                      onClick: this.supportRequestModal,
                    },
                    ['Contact Us']
                  ),
                  //passing in signOut as goToLink argument to execute logout flow
                  h(BasicListItem, {
                    isRendered: isLogged,
                    applyPointer,
                    label: 'Sign Out',
                    onClick: this.signOut,
                  }),
                ]),
              ]
            ),
          ]
        ),
        supportrequestModal,
      ]),
    ]);
  }

}

export default withRouter(withStyles(styles)(DuosHeader));
