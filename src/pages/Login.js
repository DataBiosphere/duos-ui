import { Component } from 'react';
import GoogleLogin from 'react-google-login';
import { a, div, h, h3, img, label, span } from 'react-hyperscript-helpers';
import { Alert } from '../components/Alert';
import { User } from '../libs/ajax';
import { Config } from '../libs/config';
import { Storage } from '../libs/storage';
import { USER_ROLES, isObjectEmpty } from '../libs/utils';
import './Login.css';


class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectUrl: this.props.match.url,
      clientId: '',
      error: {},
    };
    this.getGoogleClientId();
  }

  async getGoogleClientId() {
    const clientKey = `${await Config.getGoogleClientId()}`;
    this.setState(prev => {
      prev.clientId = clientKey;
      return prev;
    });
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
        this.props.onSignIn();
        this.redirect(user, this.state.redirectUrl);
      },
      error => {
        Storage.clearStorage();
        alert(response.w3.U3 + ' is not a registered user.');
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
    this.setState(prev => {
      prev.error = { "title": response.error, "description": response.details};
      return prev;
    });
  };

  // redirect() returns the initial page to be redirected when a user logs in
  // for external re-directions, the method will first check if the usr has permission to access,
  // if this is true, and user is not logged, it will be auto-logged and redirected to the url.
  redirect = (user, redirectUrl) => {
    let page = '/home';
    if (this.props.componentRoles !== undefined && this.verifyUserRoles(this.props.componentRoles, Storage.getCurrentUser())) {
      page = redirectUrl;
    } else {
      page = user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isAdmin ? 'admin_console' :
            user.isResearcher ? 'dataset_catalog?reviewProfile' :
              user.isDataOwner ? 'data_owner_console' :
                user.isAlumni ? 'summary_votes' : '/';
    }
    this.props.history.push(page);
  };

  verifyUserRoles = (allowedComponentRoles, usrRoles) => {
    if (usrRoles) {
      return allowedComponentRoles.some(
        componentRole => (usrRoles.roles.map(roles => roles.name)
          .indexOf(componentRole) >= 0 || componentRole === USER_ROLES.all)
      );
    }
    return false;
  };

  render() {

    let googleLoginButton;

    if (this.state.clientId === '') {
      googleLoginButton = div({ style: { 'position': 'relative', 'marginTop': '20px', 'marginLeft': '45px', 'zIndex': '10000' } }, [
        img({ src: '/images/loading-indicator.svg', alt: 'spinner' })
      ]);
    } else {
      googleLoginButton = h(GoogleLogin, {
        className: "btn_gSignInWrapper",
        clientId: this.state.clientId,
        onSuccess: this.responseGoogle,
        onFailure: this.forbidden,
        isSignedIn: this.state.redirectUrl !== '/login'
      }, [
          div({ id: "btn_gSignIn", className: "btn_gSignIn" }, [
            span({ className: "icon" }),
            label({}, ["Sign in with Google"])
          ])
        ]);
    }

    return (
      div({ className: 'container' }, [
        div({ className: 'landing-box col-lg-6 col-lg-offset-3 col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-10 col-xs-offset-1' }, [
          div({ className: 'landing-box-brand' }, [
            img({ src: '/images/broad_logo.png', alt: 'Broad Institute Logo' }, []),
            div({ className: 'landing-box-title' }, [h3({}, ['Broad Data Use Oversight System'])]),
            div({ className: 'landing-box-google-signin' }, [
              div({ isRendered: !isObjectEmpty(this.state.error), className: 'dialog-alert' }, [
                Alert({ id: 'dialog', type: 'danger', title: this.state.error.title, description: this.state.error.description })
              ]),
              div({ isRendered: isObjectEmpty(this.state.error) }, [
                div({ className: 'new-sign' }, ['Sign in with a google account']),
                googleLoginButton,
                div({ className: 'new-sign' }, [
                  span({}, [
                    'Don\'t have a Google Account? Create one ',
                    a({
                      href: 'https://accounts.google.com/SignUp?continue:https%3A%2F%2Faccounts.google.com%2Fo%2Foauth2%2Fauth%3Fopenid.realm%26scope%3Demail%2Bprofile%2Bopenid%26response_type%3Dpermission%26redirect_uri%3Dstoragerelay%3A%2F%2Fhttp%2Flocalhost%3A8000%3Fid%253Dauth721210%26ss_domain%3Dhttp%3A%2F%2Flocalhost%3A8000%26client_id%3D832251491634-smgc3b2pogqer1mmdrd3hrqic3leof3p.apps.googleusercontent.com%26fetch_basic_profile%3Dtrue%26hl%3Des-419%26from_login%3D1%26as%3D43c5de35a7316d00&ltmpl:popup',
                      target: '_blank'
                    }, ['here.'])
                  ])
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default Login;
