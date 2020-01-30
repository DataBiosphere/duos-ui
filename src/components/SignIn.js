import _ from 'lodash/fp';
import { Component } from 'react';
import GoogleLogin from 'react-google-login';
import { div, h, hh, img } from 'react-hyperscript-helpers';
import { Alert } from '../components/Alert';
import { User } from '../libs/ajax';
import { Config } from '../libs/config';
import { Storage } from '../libs/storage';
import { USER_ROLES } from '../libs/utils';


export const SignIn = hh(class SignIn extends Component {
  constructor(props) {
    super(props);
    this.state = {
      clientId: '',
      error: {}
    };
    this.getGoogleClientId();
  }

  async getGoogleClientId() {
    const clientKey = `${ await Config.getGoogleClientId() }`;
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
        this.redirect(user);
      },
      error => {
        Storage.clearStorage();
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
      });
  };

  forbidden = (response) => {
    Storage.clearStorage();
    this.setState(prev => {
      prev.error = { 'title': response.error, 'description': response.details };
      return prev;
    });
  };

  redirect = (user) => {
    const page = user.isAdmin ? 'admin_console' :
      user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isResearcher ? 'researcher_console' :
            user.isDataOwner ? 'data_owner_console' :
              user.isAlumni ? 'summary_votes' : '/';
    this.props.history.push(page);
    this.props.onSignIn();
  };

  render() {

    let googleLoginButton;

    if (this.state.clientId === '') {
      googleLoginButton = div({ style: { 'position': 'relative', 'marginTop': '20px', 'marginLeft': '45px', 'zIndex': '10000' } }, [
        img({ src: '/images/loading-indicator.svg', alt: 'spinner' })
      ]);
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
        }
      );
    }

    return (
      div({}, [
        div({ isRendered: !_.isEmpty(this.state.error), className: 'dialog-alert' }, [
          Alert({ id: 'dialog', type: 'danger', title: this.state.error.title, description: this.state.error.description })
        ]),
        div({ isRendered: _.isEmpty(this.state.error) }, [googleLoginButton])
      ])
    );
  }
});
