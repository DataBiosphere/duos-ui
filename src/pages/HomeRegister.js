import { Component } from 'react';
import GoogleLogin from 'react-google-login';
import { div, h, h1, hr, label, span } from 'react-hyperscript-helpers';
import { Alert } from '../components/Alert';
import { User } from '../libs/ajax';
import { Config } from '../libs/config';
import { Models } from '../libs/models';
import { Storage } from '../libs/storage';
import { USER_ROLES } from '../libs/utils';
import './Login.css';


class HomeRegister extends Component {
  constructor(props) {
    super(props);
    this.state = {
      displayName: '',
      clientId: '',
      error: Models.error
    };
    this.myHandler = this.myHandler.bind(this);
    this.getGoogleClientId();
  }

  async getGoogleClientId() {
    const clientKey = `${ await Config.getGoogleClientId() }`;
    this.setState(prev => {
      prev.clientId = clientKey;
      return prev;
    });
  }

  getUser = async () => {
    return await User.getByEmail(Storage.getGoogleData().profileObj.email);
  };

  responseGoogle = async (response) => {
    Storage.setGoogleData(response);

    User.registerUser().then(
      data => {
        data = Object.assign(data, this.setRoles(data));
        this.setStorage(data);
        this.props.history.push('/profile');
      },
      error => {
        const status = error.status;
        switch (status) {
          case 400:
            this.setState(prev => {
              prev.error = { show: true, title: 'Error', msg: JSON.stringify(error) };
              return prev;
            });
            break;
          case 409:
            // If the user exists, just log them in.
            this.getUser().then(
              user => {
                user = Object.assign(user, this.setRoles(user));
                this.setStorage(user);
                this.redirect(user);
              },
              error => {
                Storage.clearStorage();
              });
            break;
          default:
            this.setState(prev => {
              prev.error = { show: true, title: 'Error', msg: 'Unexpected error, please try again' };
              return prev;
            });
            break;
        }
      }
    );
  };

  setRoles(user) {
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

  setStorage(user) {
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
      googleLoginButton = div({ style: { 'position': 'relative', 'marginTop': '20px', 'marginLeft': '45px', 'zIndex': '10000' } });
    } else {
      googleLoginButton = h(GoogleLogin, {
        scope: 'openid email profile',
        className: 'g-signin2',
        dataWidth: '30',
        dataHeight: '200',
        dataLongtitle: 'true',
        theme: 'dark',
        clientId: this.state.clientId,
        onSuccess: this.responseGoogle,
        onFailure: this.forbidden
      });
    }

    return (
      div({ className: 'row home' }, [
        div({ className: 'col-lg-8 col-lg-offset-2 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          h1({ className: 'home-title' }, ['Join DUOS']),
          div({ className: 'home-title-description' }, ['Sign up to DUOS to find genomic datasets of interest and to submit Data Access Requests.']),
          hr({ className: 'home-line' }),
          div({style: { margin: '1rem 0 1rem 0' }}, [googleLoginButton]),
          div({ isRendered: this.state.error.show }, [
            Alert({ id: 'modal', type: 'danger', title: this.state.error.title, description: this.state.error.msg })
          ])
        ])
      ])
    );
  }
}

export default HomeRegister;
