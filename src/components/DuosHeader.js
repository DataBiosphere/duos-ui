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
import {NavigationUtils} from '../libs/utils';
import { Styles } from '../libs/theme';
import DuosLogo from '../images/duos_logo.svg';
import contactUsHover from '../images/navbar_icon_contact_us_hover.svg';
import contactUsStandard from '../images/navbar_icon_contact_us.svg';

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
  const {isRendered, targetLink, label, goToLink, applyPointer} = props;

  const onMouseEnter = applyPointer;

  return (
    h(ListItem, {
      isRendered,
      alignItems: 'center',
      id: `menu-link-${label}`,
      style: Styles.NAVBAR.DRAWER_LINK,
      onClick: (e) => goToLink(targetLink),
      onMouseEnter
    }, [label])
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
        onClick: (e) => goToLink(linkData.link),
        alignItems: 'center',
        id: `menu-link-${label}`,
        isRendered: linkData.isRendered,
        style: Styles.NAVBAR.DRAWER_LINK,
        onMouseEnter
      }, [label]);
    });
  };

  const handleClose = (e) => {
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
      dacChairPath: '/chair_console',
      openDrawer: false
    };
  };

  async componentDidMount() {
    let dacChairPath = await NavigationUtils.dacChairConsolePath();
    this.setState({dacChairPath: dacChairPath});
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

  toggleDrawer = (boolVal) => {
    this.setState((prev) => {
      prev.openDrawer = boolVal;
      return prev;
    });
  };

  goToLink = (link) => {
    this.props.history.push(link);
    this.toggleDrawer(false);
  }

  render() {
    const { classes } = this.props;

    let isChairPerson = false;
    let isMember = false;
    let isAdmin = false;
    let isResearcher = false;
    let isDataOwner = false;
    let isLogged = Storage.userIsLogged();
    let currentUser = {};

    if (isLogged) {
      currentUser = Storage.getCurrentUser();
      isChairPerson = currentUser.isChairPerson;
      isMember = currentUser.isMember;
      isAdmin = currentUser.isAdmin;
      isResearcher = currentUser.isResearcher;
      isDataOwner = currentUser.isDataOwner;
    }

    const dropdownLinks = {
      statistics: {
        'Votes Statistics': {
          link: '/summary_votes'
        },
        'Reviewed Cases Record': {
          link: '/reviewed_cases'
        }
      }
    };

    const duosLogoImage = {
      width: '140px',
      height: '40px',
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

    return (
      nav({ className: 'navbar-duos', role: 'navigation' }, [
        h(Hidden, {mdDown: true}, [
          div({ className: 'row no-margin' }, [
            h(Link, { id: 'link_logo', to: '/home', className: 'navbar-brand' }, [
              img({ style: duosLogoImage, src: DuosLogo, alt: 'DUOS Logo'})
            ]),
            //Standard navbar for medium sized displays and higher (pre-existing navbar)
            div({}, [
              ul({ isRendered: isLogged, className: 'navbar-logged' }, [
                li({ className: 'dropdown user-li' }, [
                  a({ id: 'sel_dacUser', role: 'button', className: 'dropdown-toggle', 'data-toggle': 'dropdown' }, [
                    div({ id: 'dacUser' }, [
                      currentUser.displayName,
                      span({ className: 'caret caret-margin' })
                    ]),
                    small({ id: 'dacUserMail' }, [currentUser.email])
                  ]),
                  ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                    li([
                      h(Link, { id: 'link_profile', to: '/profile' }, ['Your Profile'])
                    ]),
                    li({}, [a({ id: 'link_signOut', onClick: this.signOut }, ['Sign out'])])
                  ])
                ]),
                li({ isRendered: isAdmin }, [
                  h(Link, { id: 'link_adminConsole', to: '/admin_console' }, ['Admin Console'])
                ]),

                li({ isRendered: isChairPerson }, [
                  h(Link, { id: 'link_chairConsole', to: this.state.dacChairPath }, ['DAC Chair Console'])
                ]),

                li({ isRendered: isMember }, [
                  h(Link, { id: 'link_memberConsole', to: '/member_console' }, ['DAC Member Console'])
                ]),

                li({ isRendered: isResearcher }, [
                  h(Link, { id: 'link_researcherConsole', to: '/researcher_console' }, ['Researcher Console'])
                ]),

                li({ isRendered: isDataOwner }, [
                  h(Link, { id: 'link_dataOwnerConsole', to: '/data_owner_console' }, ['Data Owner Console'])
                ]),

                li({ isRendered: isResearcher }, [
                  h(Link, { id: 'link_requestApplication', to: '/dar_application' }, ['Request Application'])
                ]),

                li({ className: 'dropdown', isRendered: isAdmin }, [
                  a({ id: 'sel_statistics', role: 'button', className: 'dropdown-toggle', 'data-toggle': 'dropdown' }, [
                    div({}, ['Statistics', span({ className: 'caret caret-margin' }, [])])
                  ]),
                  ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                    li({}, [
                      h(Link, { id: 'link_statistics', to: '/summary_votes' }, ['Votes Statistics'])
                    ]),
                    hr({ style: hrStyle }),
                    li({}, [
                      h(Link, {
                        id: 'link_reviewedCases', to: '/reviewed_cases'
                      }, ['Reviewed Cases Record'])
                    ])
                  ])
                ]),

                li({}, [
                  h(Link, { id: 'link_datasetCatalog', isRendered: isLogged, to: '/dataset_catalog' }, ['Dataset Catalog'])
                ]),
                li({}, [h(Link, { id: 'link_help', to: '/FAQs' }, ['FAQs'])]),
                contactUsButton, supportrequestModal
              ]),

              ul({ isRendered: !isLogged, className: 'navbar-public' }, [
                li({}, [
                  h(Link, { id: 'link_about', className: 'navbar-duos-link', to: '/home_about' }, [
                    div({ className: 'navbar-duos-icon-about', style: navbarDuosIcon }),
                    span({ style: navbarDuosText }, ['About'])
                  ])
                ]),
                li({}, [
                  h(Link, { id: 'link_help', className: 'navbar-duos-link', to: '/FAQs' }, [
                    div({ className: 'navbar-duos-icon-help', style: navbarDuosIcon }),
                    span({ style: navbarDuosText }, ['FAQs'])
                  ])
                ]),
                contactUsButton, supportrequestModal
              ])
            ])
          ]),
        ]),
        //NOTE: old navbar style is heavily dependent on css styles with element specific styles
        //Hard to make that navbar flexible with material-ui's syntax
        //For now I will use material-ui's hidden element to selectively render the two different navbars
        //I'll look into rewriting the large navbar on a later PR
        h(Hidden, {lgUp: true}, [
          div({style: {display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}, [
            img({
              style: duosLogoImage, src: DuosLogo,
              alt: 'DUOS Logo',
              onClick: (e) => this.goToLink('/home')
            }),
            h(IconButton, {size: 'small', onClick: (e) => this.toggleDrawer(true)}, [
              h(MenuIcon, {
                id: 'navbar-menu-icon',
                style: {color: 'white', fontSize: '6rem', flex: 1},
                anchor: 'right',
              }, [])
            ]),
            h(Drawer, {
              anchor: 'right',
              open: this.state.openDrawer,
              PaperProps: {
                className: classes.drawerPaper
              },
              style: {
                // I have to give this a ridiculous z-index value to keep the google sign in widget or register link from showing up on top
              },
              onClose: (e) => this.toggleDrawer(false)
            }, [
              h(List, {}, [
                //NOTE: create user component to show logged in status (as well as dropdown options)
                h(BasicListItem, {isRendered: isLogged, applyPointer, targetLink: '/profile', label: 'Your Profile', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: isAdmin, applyPointer, targetLink: '/admin_console', label: 'Admin Console', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: isChairPerson, applyPointer, targetLink: this.state.dacChairPath, label: 'DAC Chair Console', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: isMember, applyPointer, targetLink: '/member_console', label: 'DAC Member Console', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: isResearcher, applyPointer, targetLink: '/researcher_console', label: 'Researcher Console', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: isDataOwner, applyPointer, targetLink: '/data_owner_console', label: 'Data Owner Console', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: isResearcher, applyPointer, targetLink: '/dar_application', label: 'Request Application', goToLink: this.goToLink}),
                h(DropdownComponent, {isRendered: isAdmin, label: 'Statistics', goToLink: this.goToLink, onMouseEnter: applyPointer, dropdownLinks: dropdownLinks.statistics, classes}),
                h(BasicListItem, {isRendered: isLogged, applyPointer, targetLink: '/dataset_catalog', label: 'Dataset Catalog', goToLink: this.goToLink}),
                h(BasicListItem, {isRendered: !isLogged, applyPointer, targetLink: '/home_about', label: 'About', goToLink: this.goToLink}),
                h(BasicListItem, { applyPointer, targetLink: '/FAQs', label: 'FAQs', goToLink: this.goToLink}),
                //contact us doesn't use the Basic List Item since it just makes the modal visible, which is different from the redirect functionality from basicList
                h(ListItem, {alignItems: 'center', onMouseEnter: applyPointer, style: Styles.NAVBAR.DRAWER_LINK, onClick: this.supportRequestModal}, ['Contact Us']),
                //passing in signOut as goToLink argument to execute logout flow
                h(BasicListItem, {isRendered: isLogged, applyPointer,label: 'Sign Out', goToLink: this.signOut}),
              ]),
            ])
          ]),
          supportrequestModal
        ])
      ])
    );
  }

}

export default withRouter(withStyles(styles)(DuosHeader));
