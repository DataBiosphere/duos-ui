import { Component } from 'react';
import { nav, button, ul, li, img, small, hr, div, span, a } from 'react-hyperscript-helpers';
import { HelpModal } from '../components/modals/HelpModal';
import { Storage } from '../libs/storage';

class DuosHeader extends Component {

  navBarCollapsed = true;

  constructor(props) {
    super(props);
    this.state = {
      isLogged: props.isLogged,
      googleButton: props.button,
      showHelpModal: false,
    };
    this.signIn = this.signIn.bind(this);
    this.signOut = this.signOut.bind(this);
    this.toggleNavBar = this.toggleNavBar.bind(this);
  };

  helpModal = (e) => {
    this.setState(prev => {
      prev.showHelpModal = true;
      return prev;
    });
  };

  okModal = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  closeModal = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  afterModalOpen = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  render() {

    // let roles = ['chairperson', 'member', 'admin', 'researcher', 'dataOwner', 'alumni'];
    let roles = ['admin', 'researcher'];
    let isChairPerson = false;
    let isMember = false;
    let isAdmin = false;
    let isResearcher = false;
    let isDataOwner = false;
    let isAlumni = false;

    let isLogged = Storage.userIsLogged();

    if (isLogged) {
      roles.forEach(role => {
        if (role === 'chairperson') {
          isChairPerson = true;
        }
        if (role === 'member') {
          isMember = true;
        }
        if (role === 'admin') {
          isAdmin = true;
        }
        if (role === 'researcher') {
          isResearcher = true;
        }
        if (role === 'dataOwner') {
          isDataOwner = true;
        }
        if (role === 'alumni') {
          isAlumni = true;
        }
      });
    }
    let currentUser = {};
    let profile = Storage.getGoogleData();
    if (isLogged && profile !== null) {
      currentUser = {
        displayName: profile.profileObj.name,
        email: profile.profileObj.email
      };
    }
    return (

      nav({ className: "navbar top-navigator-bar", role: "navigation" }, [
        div({ className: "row top-navigator" }, [
          div({ className: "navbar-header" }, [
            button({ id: "btn_hamburger", type: "button", className: "navbar-toggle", onClick: this.toggleNavBar }, [
              span({ className: "sr-only" }, ["Toggle navigation"]),
              span({ className: "icon-bar" }, []),
              span({ className: "icon-bar" }, []),
              span({ className: "icon-bar" }, []),
            ]),

            a({ id: "link_logo", href: "/home", className: "navbar-duos-brand" }, [
              img({ src: "/images/duos_logo.svg", alt: "DUOS Logo" }),
            ]),
          ]),

          div({ className: "collapse navbar-collapse no-padding", collapse: "navbarCollapsed" }, [

            ul({ isRendered: isLogged, className: "navbar-right no-margin" }, [
              li({ className: "dropdown user-li" }, [
                a({ id: "sel_dacUser", role: "button", className: "dropdown-toggle", "data-toggle": "dropdown" }, [
                  div({ id: "dacUser" }, [
                    currentUser.displayName,
                    span({ className: "caret caret-margin" })
                  ]),
                  small({ id: "dacUserMail" }, [currentUser.email]),
                ]),
                ul({ className: "dropdown-menu user-dropdown", role: "menu" }, [
                  li({ isRendered: isResearcher }, [a({ id: "link_profile", href: "/researcher_profile" }, ["Your Profile"]),]),
                  li({}, [a({ id: "link_signOut", onClick: this.signOut }, ["Sign out"]),]),
                ]),
              ]),
            ]),

            div({ className: "collapse navbar-collapse no-padding col-lg-10 col-md-10 col-sm-9 col-xs-12 navbar-right", collapse: "navbarCollapsed" }, [

              ul({ isRendered: !isLogged, className: "no-margin" }, [
                li({}, [a({ id: "link_about", className: "navbar-duos-link", href: "/home_about" }, [div({ className: "navbar-duos-icon navbar-duos-icon-about" }), "About"]),]),
                li({}, [a({ id: "link_help", className: "navbar-duos-link", href: "/home_help" }, [div({ className: "navbar-duos-icon navbar-duos-icon-help" }), "Help"]),]),
                li({}, [
                  a({ id: "link_signIn", onClick: this.signIn }, [this.state.googleButton])
                  // a({ className: "navbar-duos-button", href: '/login' }, ["Sign In"])
                  // a({ className: "navbar-duos-button", onClick: this.signIn }, ["Sign In"])
                ]),
                li({}, [a({ id: "link_join", className: "navbar-duos-link-join", href: "/home_register" }, ["Join DUOS"]),]),
              ])
            ]),

            ul({ isRendered: isLogged, className: "navbar-left no-margin" }, [
              li({ isRendered: isChairPerson }, [
                a({ id: "link_chairConsole", href: "/chair_console" }, ["DAC Console"]),
              ]),

              li({ isRendered: isMember }, [
                a({ id: "link_memberConsole", href: "/member_console" }, ["DAC Console"]),
              ]),

              li({ isRendered: isAdmin }, [
                a({ id: "link_adminConsole", href: "/admin_console" }, ["Admin Console"]),
              ]),

              li({ isRendered: isResearcher }, [
                a({ id: "link_researcherConsole", href: "/researcher_console" }, ["Researcher Console"]),
              ]),

              li({ isRendered: isDataOwner }, [
                a({ id: "link_dataOwnerConsole", href: "/data_owner_console" }, ["Data Owner Console"]),
              ]),

              li({ isRendered: isResearcher }, [
                a({ id: "link_requestApplication", href: "/dar_application" }, ["Request Application"]),
              ]),

              li({ className: "dropdown", onToggle: this.toggled, isRendered: isLogged }, [
                a({ id: "sel_statistics", role: "button", className: "dropdown-toggle", "data-toggle": "dropdown" }, [
                  div({}, ["Statistics", span({ className: "caret caret-margin" }, []),]),
                ]),
                ul({ className: "dropdown-menu user-dropdown", role: "menu" }, [
                  li({}, [a({ id: "link_statistics", href: "/summary_votes", className: "f-left" }, ["Votes Statistics"]),]),
                  hr({}),
                  li({}, [a({ id: "link_reviewedCases", href: "/reviewed_cases", className: "f-left" }, ["Reviewed Cases Record"]),]),
                ]),
              ]),

              li({}, [a({ isRendered: isLogged, href: "/dataset_catalog" }, ["Dataset Catalog"]),]),

              li({ className: "dropdown", onToggle: this.toggled }, [
                a({ id: "sel_requestHelp", isRendered: isLogged, role: "button", className: "dropdown-toggle", "data-toggle": "dropdown" }, [
                  div({}, ["Request Help", span({ className: "caret caret-margin" })])
                ]),
                ul({ className: "dropdown-menu user-dropdown", role: "menu" }, [
                  li({}, [a({ id: 'link_helpModal', className: "f-left", onClick: this.helpModal }, ["Create a Report"]),

                  HelpModal({
                    showModal: this.state.showHelpModal,
                    onOKRequest: this.okModal,
                    onCloseRequest: this.closeModal,
                    onAfterOpen: this.afterModalOpen
                  }),
                  ]),
                  hr({}),
                  li({}, [a({ id: "link_reportList", href: "/help_reports", className: "f-left" }, ["List of Reports"])]),
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }

  isUserLogged() {
    return this.state.isLogged;
  }

  notYet() {
  }

  toggled() {
  }

  signIn() {
    this.setState({ isLogged: true }, function () {
      this.props.loginState(this.state.isLogged);
    });
  }

  signOut() {
    this.setState({ isLogged: false }, function () {
      this.props.loginState(this.state.isLogged);
      window.location.href = "/";
    });
  }

  toggleNavBar() {
    this.navBarCollapsed = !this.navBarCollapsed;
  }

  goToRP() {

  }

}

export default DuosHeader;
