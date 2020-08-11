import {Component} from 'react';
import {a, button, div, h, hr, img, li, nav, small, span, ul} from 'react-hyperscript-helpers';
import ResponsiveMenu from 'react-responsive-navbar';
import {Link, withRouter} from 'react-router-dom';
import {Storage} from '../libs/storage';
import {SupportRequestModal} from './modals/SupportRequestModal';
import './DuosHeader.css';

class DuosHeader extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showSupportRequestModal: false,
      hover: false
    };
  };

  toggleHover = () => {
    this.setState(prev => {
      prev.hover = !this.state.hover;
      return prev;
    });
  };

  signOut = () => {
    this.props.history.push('/home');
    this.props.onSignOut();
  };

  supportRequestModal = () => {
    this.setState(prev => {
      prev.showSupportRequestModal = true;
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

  render() {

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

    const duosLogoImage = {
      width: '140px',
      height: '40px',
      padding: '0',
      margin: '12px 64px 0 0'
    }

    const navbarDuosIcon = {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      margin: '0 8px 0 0',
      transition: 'all 0.3s ease !important',
      verticalAlign: 'baseline'
    }

    const navbarDuosText = {
      display: 'inline',
      verticalAlign: 'text-bottom'
    }

    const hrStyle = {
      float: 'right',
      margin: '0',
      width: '100%'
    }

    const contactUsSource = this.state.hover ? '/images/navbar_icon_contact_us_hover.svg' : '/images/navbar_icon_contact_us.svg';
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
        div({ className: 'row no-margin' }, [
          h(Link, { id: 'link_logo', to: '/home', className: 'navbar-brand' }, [
            img({ style: duosLogoImage, src: '/images/duos_logo.svg', alt: 'DUOS Logo'})
          ]),
          h(ResponsiveMenu, {
            changeMenuOn: '767px',
            menuOpenButton: div({ className: 'navbar-open-icon' }, []),
            menuCloseButton: div({ className: 'navbar-close-icon' }, []),
            menu:
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
                    h(Link, { id: 'link_chairConsole', to: '/chair_console' }, ['DAC Chair Console'])
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

                  li({}, [
                    h(Link, { id: 'link_help', to: '/FAQs' }, ['FAQs'])
                  ]),

                  li({ className: 'dropdown', isRendered: isAdmin }, [
                    a({ id: 'sel_statistics', role: 'button', className: 'dropdown-toggle', 'data-toggle': 'dropdown' }, [
                      div({}, ['Statistics', span({ className: 'caret caret-margin' }, [])])
                    ]),
                    ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                      li({}, [
                        h(Link, { id: 'link_statistics', to: '/summary_votes', className: 'f-left' }, ['Votes Statistics'])
                      ]),
                      hr({ style: hrStyle }),
                      li({}, [
                        h(Link, {
                          id: 'link_reviewedCases', to: '/reviewed_cases', className: 'f-left', isRendered: !(isDataOwner || isResearcher) || isAdmin
                        }, ['Reviewed Cases Record'])
                      ])
                    ])
                  ]),

                  li({}, [
                    h(Link, { id: 'link_datasetCatalog', isRendered: isLogged, to: '/dataset_catalog' }, ['Dataset Catalog'])
                  ]),
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
                    h(Link, { id: 'link_NHGRIpilot', className: 'navbar-duos-link', to: '/NHGRIpilotinfo' }, [
                      div({ className: 'navbar-duos-icon-about', style: navbarDuosIcon }),
                      span({ style: navbarDuosText }, ['NHGRI Pilot Info'])
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
          })
        ])
      ])
    );
  }

}

export default withRouter(DuosHeader);
