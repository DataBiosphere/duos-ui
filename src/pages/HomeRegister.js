import { Component } from 'react';
import { div, h1, form, label, input, hr, span, h } from 'react-hyperscript-helpers';
import { Config } from "../libs/config";
import { USER_ROLES } from '../libs/utils';
import GoogleLogin from 'react-google-login';
import { Storage } from "../libs/storage";
import './Login.css';

class HomeRegister extends Component {

  constructor(props) {
    super(props);
    this.state = {
      displayName: '',
      loading: true,
      clientId: ''
    };
    this.getGoogleClientId();
    this.myHandler = this.myHandler.bind(this);
  }

  async getGoogleClientId() {
    const clientKey = `${await Config.getGoogleClientId()}`;
    this.setState(prev => {
      prev.clientId = clientKey;
      prev.loading = false;
      return prev;
    });
  }

  getUser = async () => {
    let role = {};
    let user = {};
    user.roles = [];
    role.name = USER_ROLES.researcher;
    user.roles.push(role);
    user.displayName = this.state.displayName;
    return user;
  };

  responseGoogle = async (response) => {
    Storage.setGoogleData(response);
    this.getUser().then(
      user => {
        const currentUserRoles = user.roles.map(roles => roles.name);
        user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
        user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
        user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
        user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
        user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
        user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
        Storage.setCurrentUser(user);
        Storage.setUserIsLogged(true);
        this.props.history.push('dataset_catalog?reviewProfile');
      },
      error => {
        Storage.clearStorage();
        alert(response.w3.U3 + ' is not a registered user.');
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
  };

  myHandler(event) {
  let displayName = event.target.value;
    this.setState(prev => {
      prev.displayName = displayName;
      return prev;
    });
  }

  render() {
    let googleLoginButton;
    if (this.state.clientId === '') {
      googleLoginButton = div({ style: { 'position': 'relative', 'marginTop': '20px', 'marginLeft': '45px', 'zIndex': '10000' } }, [
        // img({ src: '/images/loading-indicator.svg', alt: 'spinner' })
        'loading...'
      ]);
    } else {
      console.log("clientID !!!!!!!!!!!!!!!!!!!!!!", this.state.clientId);
      googleLoginButton = h(GoogleLogin, {
        // className: "btn_gSignInWrapper",
        clientId: this.state.clientId,
        onSuccess: this.responseGoogle,
        onFailure: this.forbidden,
      }, [
        // div({ id: "btn_gSignIn", className: "btn_gSignIn" }, [
        //   span({ className: "icon" }),
        //   label({}, ["Sign in with Google"])
        // ])
      ]);
    }



    // const googleLoginButton = h(GoogleLogin, {
    //   className: "btn_gSignInWrapper",
    //   clientId: this.state.clientId,
    //   onSuccess: this.responseGoogle,
    //   onFailure: this.forbidden
    // }, [
    //   div({ id: "btn_gSignIn", className: "btn_gSignIn" }, [
    //     span({ className: "icon" }),
    //     label({}, ["Sign in with Google"])
    //   ])
    // ]);

    return (
      div({ className: "row home" }, [
        div({ className: "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h1({ className: "home-title" }, ["Join DUOS"]),
          div({ className: "home-title-description" }, ["Sign up to DUOS to find genomic datasets of interest and to submit Data Access Requests."]),
          hr({ className: "home-line" }),
          div({ className: "row" }, [
            div({ className: "col-lg-6 col-md-8 col-sm-12 col-xs-12" }, [
              label({ className: "home-control-label col-lg-12 col-md-12 col-sm-12 col-xs-12" }, ["Full Name"]),
              input({ className: "form-control col-lg-12 col-md-12 col-sm-12 col-xs-12", type: "text", onChange: this.myHandler }),
            ]),
            div({ className: "landing-box-google-signin" }, [

              googleLoginButton,
            ]),

            div({ className: "col-lg-6 col-md-8 col-sm-12 col-xs-12" }, [
              div({ className: "pos-relative" }, [
                div({ className: "custom-g-signin2 g-signin2 signInRegister", "data-onsuccess": "onSignIn", "data-theme": "dark"  }),
                div({ isRendered: !form.name, className: "signInDisabledButton" })
              ]),
            ]),
          ])
        ])
      ])
    );
  }
}

export default HomeRegister;

