import { Component } from 'react';
import { div, h1, form, label, input, hr, span, h, img, h3, a } from 'react-hyperscript-helpers';
import { Config } from "../libs/config";
import { USER_ROLES } from '../libs/utils';
import GoogleLogin from 'react-google-login';
import { Storage } from "../libs/storage";
import './Login.css';
import { User } from "../libs/ajax";

class HomeRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayName: '',
      clientId: ''
    };
    this.myHandler = this.myHandler.bind(this);
    this.getGoogleClientId();
  }

  async getGoogleClientId() {
    const clientKey = `${await Config.getGoogleClientId()}`;
    this.setState(prev => {
      prev.clientId = clientKey;
      return prev;
    });
  }

  getNewUser = () => {
    let role = {};
    let user = {};
    user.roles = [];
    role.name = USER_ROLES.researcher;
    user.roles.push(role);
    user.displayName = this.state.displayName;
    return user;
  };

  getUser = async () => {
    return await User.getByEmail(Storage.getGoogleData().profileObj.email);
  };

  responseGoogle = async (response) => {
    Storage.setGoogleData(response);

    let newUser = this.getNewUser();

    User.registerUser(newUser).then(
      data => {
        data = Object.assign(data, this.setRoles(newUser));
        this.setStorage(data);
        this.props.history.push('dataset_catalog?reviewProfile');
      },
      error => {
        if (error.status === 400 && this.state.displayName !== '') {
          alert("User already exists.");
          this.getUser().then(
            user => {
              user = Object.assign(user, this.setRoles(user));
              this.setStorage(user);
              this.redirect(user)
            },
            error => {
              Storage.clearStorage();
            });
        }
      }
    );
  };


  static setRoles(user){
    const currentUserRoles = user.roles.map(roles => roles.name);
    let roles = {};
    roles.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
    roles.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
    roles.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
    roles.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
    roles.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
    roles.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
    return roles;
  }

  static setStorage(user) {
    Storage.setCurrentUser(user);
    Storage.setUserIsLogged(true);
  }

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

  // redirect() returns the initial page to be redirected when a user logs in
  // for external re-directions, the method will first check if the usr has permission to access,
  // if this is true, and user is not logged, it will be auto-logged and redirected to the url.
  redirect = (user) => {
     let page = user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isAdmin ? 'admin_console' :
            user.isResearcher ? 'dataset_catalog?reviewProfile' :
              user.isDataOwner ? 'data_owner_console' :
                user.isAlumni ? 'summary_votes' : '/';
    this.props.history.push(page);
  };

  render() {
    let googleLoginButton;
    if (this.state.clientId === '') {
      googleLoginButton = div({ style: { 'position': 'relative', 'marginTop': '20px', 'marginLeft': '45px', 'zIndex': '10000' } }, [
        // img({ src: '/images/loading-indicator.svg', alt: 'spinner' })
      ]);
    } else {
      googleLoginButton = h(GoogleLogin, {
        className: "btn_gSignInWrapper",
        clientId: this.state.clientId,
        onSuccess: this.responseGoogle,
        onFailure: this.forbidden,
        disabled: this.state.displayName === ''
      }, [
        div({id: "btn_gSignIn", className: "btn_gSignIn"}, [
          span({className: "icon"}),
          label({}, ["Sign in with Google"])
        ])
      ]);
    }

    return (
      div({ className: "container" }, [
        div({ className: "col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h1({ className: "home-title" }, ["Join DUOS"]),
          div({ className: "home-title-description" }, ["Sign up to DUOS to find genomic datasets of interest and to submit Data Access Requests."]),
          hr({ className: "home-line" }),
          div({ className: "row" }, [
            div({ className: "col-lg-6 col-md-8 col-sm-12 col-xs-12" }, [
            label({ className: "home-control-label col-lg-12 col-md-12 col-sm-12 col-xs-12" }, ["Full Name"]),
            input({ className: "form-control col-lg-12 col-md-12 col-sm-12 col-xs-12", type: "text", onChange: this.myHandler }),
            ]),
          ]),
          div({ className: "landing-box-google-signin" }, [googleLoginButton])
        ])
      ])
    );
  }
}
export default HomeRegister;

