import { Component } from 'react';
import { nav, button, ul, li, img, small, hr, div, span, a } from 'react-hyperscript-helpers';
import { GoogleLoginButton } from '../components/GoogleLogin';
import { GoogleLogoutButton } from '../components/GoogleLogout';
import { HelpModal } from '../components/modals/HelpModal';

class DuosHeader extends Component {

    navBarCollapsed = true;

    loggedState = false;

    constructor(props) {
        super(props);
        this.state = { isLogged: props.isLogged };
        this.signIn = this.signIn.bind(this);
        this.signOut = this.signOut.bind(this);

        this.toggleNavBar = this.toggleNavBar.bind(this);

        this.loginState = props.loginState;
        this.isLogged = props.isLogged;

    }

    render() {

        // let roles = ['chairperson', 'member', 'admin', 'researcher', 'dataOwner', 'alumni'];
        let roles = ['admin', 'researcher'];
        let isChairPerson = false;
        let isMember = false;
        let isAdmin = false;
        let isResearcher = false;
        let isDataOwner = false;
        let isAlumni = false;

        // let isLogged = false;
        const { isLogged } = this.state;

        if (isLogged) {
            roles.forEach(role => {
                if (role === 'chairperson') { isChairPerson = true; }
                if (role === 'member') { isMember = true; }
                if (role === 'admin') { isAdmin = true; }
                if (role === 'researcher') { isResearcher = true; }
                if (role === 'dataOwner') { isDataOwner = true; }
                if (role === 'alumni') { isAlumni = true; }
            });
        }
        let currentUser = {};
        if (isLogged && sessionStorage.getItem("GAPI") !== null) {
            currentUser = {
                displayName: JSON.parse(sessionStorage.getItem("GAPI")).profileObj.name,
                email: JSON.parse(sessionStorage.getItem("GAPI")).profileObj.email
            };
        }
        return (

            nav({ className: "navbar top-navigator-bar", role: "navigation", "ng-controller": "Header as Header" }, [
                div({ className: "row top-navigator" }, [
                    div({ className: "navbar-header" }, [
                        button({ type: "button", className: "navbar-toggle", onClick: this.toggleNavBar }, [
                            span({ className: "sr-only" }, ["Toggle navigation"]),
                            span({ className: "icon-bar" }, []),
                            span({ className: "icon-bar" }, []),
                            span({ className: "icon-bar" }, []),
                        ]),

                        a({ href: "/home", className: "navbar-duos-brand" }, [
                            img({ src: "/images/duos_logo.svg", alt: "DUOS Logo" }),
                        ]),
                    ]),

                    div({ className: "collapse navbar-collapse no-padding", collapse: "navbarCollapsed" }, [

                        ul({ isRendered: isLogged, className: "navbar-right no-margin" }, [
                            li({ className: "dropdown user-li", "is-open": "status.isopen" }, [
                                a({ role: "button", className: "dropdown-toggle", "data-toggle": "dropdown", "ng-disabled": "disabled" }, [
                                    div({ id: "dacUser" }, [
                                        currentUser.displayName,
                                        span({ className: "caret caret-margin" }, []),]),
                                    small({ id: "dacUserMail" }, [currentUser.email]),
                                ]),
                                ul({ className: "dropdown-menu user-dropdown", role: "menu" }, [
                                    li({ isRendered: isResearcher }, [a({ href: "/researcher_profile" }, ["Your Profile"]),]),
                                    li({}, [a({ onClick: this.signOut }, ["Sign out"]),]),
                                ]),
                            ]),
                        ]),

                        div({ className: "collapse navbar-collapse no-padding col-lg-10 col-md-10 col-sm-9 col-xs-12 navbar-right", collapse: "navbarCollapsed" }, [

                            ul({ isRendered: !isLogged, className: "no-margin" }, [
                                li({}, [a({ className: "navbar-duos-link", href: "/home_about" }, [div({ className: "navbar-duos-icon navbar-duos-icon-about" }, []), "About"]),]),
                                li({}, [a({ className: "navbar-duos-link", href: "/home_help" }, [div({ className: "navbar-duos-icon navbar-duos-icon-help" }, []), "Help"]),]),
                                li({}, [

                                    a({onClick: this.signIn}, [GoogleLoginButton({isLogged:this.isLogged, loginState:this.loginState})]),
                                    GoogleLogoutButton({isLogged:this.isLogged, loginState:this.loginState}),
                                    // a({ className: "navbar-duos-button", href: '/login' }, ["Sign In"])
                                    a({ className: "navbar-duos-button", onClick: this.signIn }, ["Sign In"])
                                ]),
                                li({}, [a({ className: "navbar-duos-link-join", href: "/home_register" }, ["Join DUOS"]),]),
                            ]),

                            ul({ isRendered: isLogged, className: "navbar-left no-margin" }, [
                                li({ isRendered: isChairPerson }, [
                                    a({ href: "/chair_console" }, ["DAC Console"]),
                                ]),

                                li({ isRendered: isMember }, [
                                    a({ href: "/user_console" }, ["DAC Console"]),
                                ]),

                                li({ isRendered: isAdmin }, [
                                    a({ href: "/admin_console" }, ["Admin Console"]),
                                ]),

                                li({ isRendered: isResearcher }, [
                                    a({ href: "/researcher_console" }, ["Researcher Console"]),
                                ]),

                                li({ isRendered: isDataOwner }, [
                                    a({ href: "/data_owner_console" }, ["Data Owner Console"]),
                                ]),

                                li({ isRendered: isResearcher }, [
                                    a({ onClick: this.goToRP }, ["Request Application"]),
                                ]),

                                li({ className: "dropdown", onToggle: this.toggled, isRendered: isLogged }, [
                                    a({ role: "button", className: "dropdown-toggle", "data-toggle": "dropdown" }, [
                                        div({}, ["Statistics", span({ className: "caret caret-margin" }, []),]),
                                    ]),
                                    ul({ className: "dropdown-menu user-dropdown", role: "menu" }, [
                                        li({}, [a({ href: "/summary_votes", className: "f-left" }, ["Votes Statistics"]),]),
                                        hr({}),
                                        li({ isRendered: true }, [
                                            a({ "ui-sref": "reviewed_cases({menu: true})", className: "f-left" }, ["Reviewed Cases Record"]),
                                        ]),
                                    ]),
                                ]),

                                li({}, [a({ isRendered: isLogged, href: "/dataset_catalog" }, ["Dataset Catalog"]),]),
                                li({ className: "dropdown", onToggle: this.toggled }, [
                                    a({ isRendered: isLogged, role: "button", className: "dropdown-toggle", "data-toggle": "dropdown" }, [
                                        div({}, ["Request Help", span({ className: "caret caret-margin" }, []),])
                                    ]),
                                    ul({ className: "dropdown-menu user-dropdown", role: "menu" }, [
                                        li({}, [
                                            HelpModal({linkType: "a-tag"}),
                                        ]),
                                        hr({}),
                                        li({}, [a({ href: "/help_me", className: "f-left" }, ["List of Reports"])]),
                                    ]),
                                ]),
                            ]),
                        ]),
                    ]),
                ]),
            ])
        );
    }

    isUserLogged() {
        console.log('------------------- isLogged ------------------------- ', this.state);
        return this.state.isLogged;
    }

    notYet() {
        console.log('Not Yet Implemented');
    }

    toggled() {
        console.log('--------------- toggled ---------------');
    }

    signIn() {
        console.log('----A----------- signIn ----------------', this.state);
        this.setState({ isLogged: true }, function() {
            console.log('-----C---------- signIn --------------', this.state);
            this.props.loginState(this.state.isLogged);
        });
        console.log('----B----------- signIn ----------------', this.state);
    }

    signOut() {
        console.log('-----A---------- signOut --------------', this.state);
        this.setState({ isLogged: false }, function() {
            console.log('-----C---------- signOut --------------', this.state);
            this.props.loginState(this.state.isLogged)
        });
        console.log('-----B---------- signOut --------------', this.state);
    }

    toggleNavBar() {
        this.navBarCollapsed = !this.navBarCollapsed;
    }

    goToRP() {
        console.log('--------------- goToRP ---------------');
    }

}

export default DuosHeader;
