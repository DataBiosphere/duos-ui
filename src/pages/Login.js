import React, { Component } from 'react';
import { div, a, img, span, h3, h } from 'react-hyperscript-helpers';
import GoogleLogin from 'react-google-login';
import { Storage } from '../libs/storage';
import { USER_ROLES } from '../libs/utils';
import { User } from '../libs/ajax';

const clientId = "xxxx";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  async getUser() {
    return await User.getByEmail(Storage.getGoogleData().profileObj.email);
  }

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
        this.props.history.push(this.redirect(user));
      },
      error => {
        Storage.clearStorage();
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
  };

  // returns the initial page to be redirected when a user logs in
  redirect = (user) => {
    let page = '/';
    if (Storage.userIsLogged()) {
      page = user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isAdmin ? 'admin_console' :
            user.isResearcher ? 'dataset_catalog' :
              user.isDataOwner ? 'data_owner_console' :
                user.isAlumni ? 'summary_votes' : '/';
    }
    return page
  };

  render() {

    const googleLoginButton = h(GoogleLogin, {
      className:"btn navbar-duos-button",
      clientId:clientId,
      buttonText : "Sign In",
      onSuccess : this.responseGoogle,
      onFailure : this.forbidden
    });

    return (
      div({ className: "container" }, [
        div({ className: "landing-box col-lg-6 col-lg-offset-3 col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-10 col-xs-offset-1" }, [
          div({ className: "landing-box-brand" }, [img({ src: "/images/broad_logo.png", alt: "Broad Institute Logo" }, []),
          div({ className: "landing-box-title" }, [h3({}, ["Broad Data Use Oversight System"]),]),
          div({ className: "landing-box-google-signin" }, [
            div({ className: "new-sign" }, ["Sign in with a google account"]),
            div({
              className: "custom-g-signin2 g-signin2", "data-theme": "dark", "data-width": "220", "data-height": "40",
              "data-longtitle": "true", "data-onsuccess": "onSignIn", "data-scope": "profile email"
            },
              [a({ id: "link_signIn", onClick: this.signIn }, [
                googleLoginButton
              ])
              ]),
            div({ className: "new-sign" }, [span({}, [
              "Don't have a Google Account? Create one",
              a({ href: "https://accounts.google.com/SignUp?continue:https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fauth%3Fopenid.realm%26scope%3Demail%2Bprofile%2Bopenid%26response_type%3Dpermission%26redirect_uri%3Dstoragerelay%3A%2F%2Fhttp%2Flocalhost%3A8000%3Fid%253Dauth721210%26ss_domain%3Dhttp%3A%2F%2Flocalhost%3A8000%26client_id%3D832251491634-smgc3b2pogqer1mmdrd3hrqic3leof3p.apps.googleusercontent.com%26fetch_basic_profile%3Dtrue%26hl%3Des-419%26from_login%3D1%26as%3D43c5de35a7316d00&ltmpl:popup", target: "_blank" }, ["here."]),]),]),
          ]),
          ]),
        ]),
      ])
    );
  }
}

export default Login;

