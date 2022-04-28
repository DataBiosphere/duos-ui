import {Component, Fragment, useState} from 'react';
import {a, button, div, h, hr, img, li, nav, small, span, ul} from 'react-hyperscript-helpers';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import {IconButton, List, ListItem, Menu, MenuItem} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import {Link, withRouter} from 'react-router-dom';
import {Storage} from '../libs/storage';
import {SupportRequestModal} from './modals/SupportRequestModal';
import './DuosHeader.css';
import { NotificationService } from '../libs/notificationService';
import { Notification } from './Notification';
import { Styles } from '../libs/theme';
import DuosLogo from '../images/duos-network-logo.svg';
import contactUsHover from '../images/navbar_icon_contact_us_hover.svg';
import contactUsStandard from '../images/navbar_icon_contact_us.svg';
import { isNil, map, uniq } from 'lodash/fp';
import {Config} from '../libs/config';

const styles = {
  drawerPaper: {
    backgroundColor: '#00243c',
    color: 'white',
    fontFamily: 'Montserrat'
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
    const { classes } = this.props;

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

    const hasTwoOrMoreRoles = () => {
      const roleNames = uniq(map("name")(currentUser.roles));
      return roleNames.length >= 2;
    };

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
      margin: '12px 64px 0 0',
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

    const hrStyle = {
      float: 'right',
      margin: '0',
      width: '100%'
    };

    const contactUsSource = this.state.hover ? contactUsHover : contactUsStandard;
    const contactUsIcon = isLogged ? '' : img({src: contactUsSource, style: {display: 'inline-block', margin: '0 8px 0 0', verticalAlign: 'baseline'}});
    const contactUsText = isLogged ? 'Contact Us': span({ style: navbarDuosText }, ['Contact Us']);
    const contactUsButton = button({
      id: "btn_applyAcces",
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
      "data-tip": "Need help? Contact us for some assistance", "data-for": "tip_requestAccess"
    }, [contactUsIcon, contactUsText]);

    const supportrequestModal = SupportRequestModal({
      showModal: this.state.showSupportRequestModal,
      onOKRequest: this.okSupportRequestModal,
      onCloseRequest: this.closeSupportRequestModal,
      url: this.props.location.pathname
    });

    const adminLink = (inDropDown) => li({ isRendered: inDropDown ? isAdmin : isAdmin && !hasTwoOrMoreRoles()}, [
      h(Link, { id: 'link_adminConsole', to: '/admin_console' }, [
        'Admin Console',
      ]),
    ]);

    const signingOfficialLink = (inDropDown)  => li({ isRendered:  inDropDown ? isSigningOfficial : isSigningOfficial && !hasTwoOrMoreRoles()}, [
      h(Link, { id: 'link_so_console', to: '/signing_official_console' }, ['Signing Official Console'])
    ]);

    const chairpersonDropDown = li({ className: 'dropdown', isRendered: isChairPerson && !hasTwoOrMoreRoles()}, [
      a(
        {
          role: 'button',
          className: 'dropdown-toggle',
          'data-toggle': 'dropdown',
        },
        [
          div({}, [
            'DAC Chair Console',
            span({ className: 'caret caret-margin' }, []),
          ]),
        ]
      ),
      ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
        li({}, [
          h(
            Link,
            { id: 'link_chairConsole', to: this.state.dacChairPath },
            ['Manage DARs']
          ),
        ]),
        hr({ style: hrStyle }),
        li({}, [
          h(Link, { id: 'link_manageDac', to: '/manage_dac' }, [
            'Manage DACs',
          ]),
        ]),
      ]),
    ]);

    const chairSubHeader =
      li({ isRendered: isChairPerson, style: {marginTop: '10px', marginBottom: '5px'} }, [
        span({style: { fontSize: '12px', fontWeight: '600', padding: '10px 15px'}}, ['DAC Chair Console'])
      ]);

    const chairManageDACsLink =
      li({ isRendered: isChairPerson, style: {marginLeft: '10px', paddingBottom: '0 !important'} }, [
        h(Link, { id: 'link_manageDac', to: '/manage_dac' }, [
          'Manage DACs',
        ]),
      ]);
    const chairManageDARsLink =
      li({ isRendered: isChairPerson, style: {marginLeft: '10px'} }, [
        h( Link, { id: 'link_chairConsole', to: this.state.dacChairPath },
          ['Manage DARs']
        ),
      ]);

    const memberLink = (inDropDown) =>
      li({ isRendered: inDropDown ? isMember : isMember && !hasTwoOrMoreRoles() }, [
        h(Link, { id: 'link_memberConsole', to: this.state.dacMemberPath }, [
          'DAC Member Console',
        ]),
      ]);

    const researcherLink = (inDropDown) => li({ isRendered: inDropDown ? isResearcher : isResearcher && !hasTwoOrMoreRoles() }, [
      h(
        Link,
        { id: 'link_researcherConsole', to: this.state.researcherPath },
        ['Researcher Console']
      ),
    ]);

    const dataOwnerLink = (inDropDown) => li({ isRendered: inDropDown ? isDataOwner :  isDataOwner && !hasTwoOrMoreRoles() }, [
      h(
        Link,
        { id: 'link_dataOwnerConsole', to: '/data_owner_console' },
        ['Data Owner Console']
      ),
    ]);

    return nav({ className: 'navbar-duos', role: 'navigation' }, [
      h(Hidden, { mdDown: true }, [
        this.makeNotifications(),
        h(Link, { id: 'link_logo', to: '/home', className: 'navbar-brand' }, [
          img({ style: duosLogoImage, src: DuosLogo, alt: 'DUOS Logo' }),
        ]),
        div({ className: 'row no-margin' }, [
          //Standard navbar for medium sized displays and higher (pre-existing navbar)
          div({}, [
            ul({ isRendered: isLogged, className: 'navbar-logged' }, [
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
                ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                  li([
                    h(Link, { id: 'link_profile', to: '/profile' }, [
                      'Your Profile',
                    ]),
                  ]),
                  li({}, [
                    a({ id: 'link_signOut', onClick: this.signOut }, [
                      'Sign out',
                    ]),
                  ]),
                ]),
              ]),

              li({ className: 'dropdown', isRendered: hasTwoOrMoreRoles() }, [
                a(
                  {
                    role: 'button',
                    className: 'dropdown-toggle',
                    'data-toggle': 'dropdown',
                  },
                  [
                    div({}, [
                      'Your Consoles',
                      span({ className: 'caret caret-margin' }, []),
                    ]),
                  ]
                ),
                ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                  adminLink(true),
                  signingOfficialLink(true),
                  chairSubHeader,
                  chairManageDARsLink,
                  chairManageDACsLink,
                  memberLink(true),
                  researcherLink(true),
                  dataOwnerLink(true)
                ]),
              ]),

              adminLink(false),
              signingOfficialLink(false),
              chairpersonDropDown,
              memberLink(false),
              researcherLink(false),
              dataOwnerLink(false),

              li({ isRendered: isResearcher }, [
                h(
                  Link,
                  { id: 'link_requestApplication', to: '/dar_application' },
                  ['Request Application']
                ),
              ]),

              li({ className: 'dropdown', isRendered: isAdmin }, [
                a(
                  {
                    id: 'sel_statistics',
                    role: 'button',
                    className: 'dropdown-toggle',
                    'data-toggle': 'dropdown',
                  },
                  [
                    div({}, [
                      'Statistics',
                      span({ className: 'caret caret-margin' }, []),
                    ]),
                  ]
                ),
                ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                  li({}, [
                    h(Link, { id: 'link_statistics', to: '/summary_votes' }, [
                      'Votes Statistics',
                    ]),
                  ]),
                  hr({ style: hrStyle }),
                  li({}, [
                    h(
                      Link,
                      {
                        id: 'link_reviewedCases',
                        to: '/reviewed_cases',
                      },
                      ['Reviewed Cases Record']
                    ),
                  ]),
                ]),
              ]),

              li({}, [
                h(
                  Link,
                  {
                    id: 'link_datasetCatalog',
                    isRendered: isLogged,
                    to: '/dataset_catalog',
                  },
                  ['Dataset Catalog']
                ),
              ]),
              li({}, [
                a({
                  id: 'link_help',
                  href: 'https://broad-duos.zendesk.com/hc/en-us/articles/360059957092-Frequently-Asked-Questions-FAQs-',
                  target: '_blank'
                }, ['FAQs']),
              ]),
              contactUsButton,
              supportrequestModal,
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
