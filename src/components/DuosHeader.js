import { Component } from 'react';
import { a, div, h, hr, img, li, nav, small, span, ul } from 'react-hyperscript-helpers';
import ResponsiveMenu from 'react-responsive-navbar';
import { Link, withRouter } from 'react-router-dom';
import { Storage } from '../libs/storage';
import './DuosHeader.css';


class DuosHeader extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showHelpModal: false
    };
    this.signOut = this.signOut.bind(this);
  };

  signOut = () => {
    this.props.history.push('/home');
    this.props.onSignOut();
  };

  helpModal = () => {
    this.setState(prev => {
      prev.showHelpModal = true;
      return prev;
    });
  };

  okModal = () => {
    this.setState(prev => {
      prev.showHelpModal = false;
      return prev;
    });
    window.location = 'help_reports';
  };

  closeModal = () => {
    this.setState(prev => {
      prev.showHelpModal = false;
      return prev;
    });
  };

  afterModalOpen = () => {
    this.setState(prev => {
      prev.showHelpModal = false;
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

    let helpLink = isAdmin ? '/help_reports' : '/home_help';

    return (

      nav({ className: 'navbar-duos', role: 'navigation' }, [
        div({ className: 'row no-margin' }, [
          h(Link, { id: 'link_logo', to: '/home', className: 'navbar-brand' }, [
            img({ src: '/images/duos_logo.svg', alt: 'DUOS Logo' })
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

                  li({ className: 'dropdown', isRendered: isAdmin }, [
                    a({ id: 'sel_statistics', role: 'button', className: 'dropdown-toggle', 'data-toggle': 'dropdown' }, [
                      div({}, ['Statistics', span({ className: 'caret caret-margin' }, [])])
                    ]),
                    ul({ className: 'dropdown-menu user-dropdown', role: 'menu' }, [
                      li({}, [
                        h(Link, { id: 'link_statistics', to: '/summary_votes', className: 'f-left' }, ['Votes Statistics'])
                      ]),
                      hr({}),
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

                  li({}, [
                    h(Link, { id: 'link_help', to: helpLink }, ['Request Help'])
                  ])
                ]),

                ul({ isRendered: !isLogged, className: 'navbar-public' }, [
                  li({}, [
                    h(Link, { id: 'link_about', className: 'navbar-duos-link', to: '/home_about' }, [
                      div({ className: 'navbar-duos-icon navbar-duos-icon-about' }),
                      span({ className: 'navbar-duos-text' }, ['About'])
                    ])
                  ]),
                  li({}, [
                    h(Link, { id: 'link_NHGRIpilot', className: 'navbar-duos-link', to: '/NHGRIpilotinfo' }, [
                      div({ className: 'navbar-duos-icon navbar-duos-icon-about' }),
                      span({ className: 'navbar-duos-text' }, ['NHGRI Pilot Info'])
                    ])
                  ]),
                  li({}, [
                    h(Link, { id: 'link_help', className: 'navbar-duos-link', to: '/home_help' }, [
                      div({ className: 'navbar-duos-icon navbar-duos-icon-help' }),
                      span({ className: 'navbar-duos-text' }, ['Help'])
                    ])
                  ])
                ])
              ])
          })
        ])
      ])
    );
  }

}

export default withRouter(DuosHeader);
