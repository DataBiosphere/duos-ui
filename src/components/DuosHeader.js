import { Component } from 'react';
import { nav, button, ul, li, img, small, hr, div, span, a } from 'react-hyperscript-helpers';
import { HelpModal } from '../components/modals/HelpModal';
import { Storage } from '../libs/storage';
import { withRouter } from "react-router-dom";

class DuosHeader extends Component {

  navBarCollapsed = true;

  constructor(props) {
    super(props);
    this.state = {
      showHelpModal: false,
      isLogged: this.props.isLogged
    };
    this.signOut = this.signOut.bind(this);
    this.toggleNavBar = this.toggleNavBar.bind(this);
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const alreadyLogged = Storage.userIsLogged();
    if (prevState.isLogged !== alreadyLogged) {
      return {
        isLogged: alreadyLogged
      }
    }
    return null;
  }

  helpModal = (e) => {
    this.setState(prev => {
      prev.showHelpModal = true;
      return prev;
    });
  };

  okModal = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
    window.location = 'help_reports';
  };

  closeModal = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  afterModalOpen = () => {
    this.setState(prev => { prev.showHelpModal = false; return prev; });
  };

  render() {

    let isChairPerson = false;
    let isMember = false;
    let isAdmin = false;
    let isResearcher = false;
    let isDataOwner = false;
    // let isAlumni = false;

    const { isLogged } = this.state;
    let currentUser = {};

    if (isLogged) {
      currentUser = Storage.getCurrentUser();
      isChairPerson = currentUser.isChairPerson;
      isMember = currentUser.isMember;
      isAdmin = currentUser.isAdmin;
      isResearcher = currentUser.isResearcher;
      isDataOwner = currentUser.isDataOwner;
      // isAlumni = currentUser.isAlumni;
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
                  a({ id: "link_signIn", className: "navbar-duos-button", href: "/login" }, ["Sign In"])
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

              li({}, [a({ id: "link_datasetCatalog", isRendered: isLogged, href: "/dataset_catalog" }, ["Dataset Catalog"]),]),

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

  toggled() {
  }

  signOut() {
    Storage.setUserIsLogged(false);
    Storage.clearStorage();
    this.props.history.push('login');
  }

  toggleNavBar() {
    this.navBarCollapsed = !this.navBarCollapsed;
  }

  goToRP() {

  }

}

export default withRouter(DuosHeader);
