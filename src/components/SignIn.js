import _ from 'lodash/fp';
import { Component } from 'react';
import GoogleLogin from 'react-google-login';
import { div, h, hh, img, span } from 'react-hyperscript-helpers';
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

  getGoogleClientId = async () => {
    const clientKey = `${ await Config.getGoogleClientId() }`;
    this.setState(prev => {
      prev.clientId = clientKey;
      return prev;
    });
  }

  getUser = async () => {
    return await User.getByEmail(Storage.getGoogleData().profileObj.email);
  }

  responseGoogle = async (response) => {
    Storage.setGoogleData(response);
    this.getUser().then(
      user => {
        user = Object.assign(user, this.setUserRoleStatuses(user));
        this.redirect(user);
      },
      error => {
        User.registerUser().then(
          user => {
            this.setUserRoleStatuses(user);
            this.props.history.push('/profile');
            this.props.onSignIn();
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
                    user = Object.assign(user, this.setUserRoleStatuses(user));
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
    console.log(JSON.stringify(response));
    if (response.error === 'popup_closed_by_user') {
      this.setState(prev => {
        prev.error = {
          description: span({}, ['Sign-in cancelled ... ', img({ height: '20px', src: '/images/loading-indicator.svg' })])
        };
        return prev;
      });
      setTimeout(() => {
        this.setState(prev => {
          prev.error = {};
          return prev;
        });
      }, 3000);
    } else {
      this.setState(prev => {
        prev.error = { 'title': response.error, 'description': response.details };
        return prev;
      });
    }
  };

  redirect = (user) => {
    const page = user.isAdmin ? 'admin_console' :
      user.isChairPerson ? 'chair_console' :
        user.isMember ? 'member_console' :
          user.isResearcher ? 'dataset_catalog' :
            user.isDataOwner ? 'data_owner_console' :
              user.isAlumni ? 'summary_votes' : '/';
    this.props.history.push(page);
    this.props.onSignIn();
  };

  setUserRoleStatuses = (user) => {
    const currentUserRoles = user.roles.map(roles => roles.name);
    user.isChairPerson = currentUserRoles.indexOf(USER_ROLES.chairperson) > -1;
    user.isMember = currentUserRoles.indexOf(USER_ROLES.member) > -1;
    user.isAdmin = currentUserRoles.indexOf(USER_ROLES.admin) > -1;
    user.isResearcher = currentUserRoles.indexOf(USER_ROLES.researcher) > -1;
    user.isDataOwner = currentUserRoles.indexOf(USER_ROLES.dataOwner) > -1;
    user.isAlumni = currentUserRoles.indexOf(USER_ROLES.alumni) > -1;
    Storage.setCurrentUser(user);
    return user;
  };

  renderSpinnerIfDisabled = (disabled) => {
    return disabled ?
      div({ style: { 'position': 'absolute', 'top': '45px', 'right': '45px', 'zIndex': '10000' } }, [
        img({ src: '/images/loading-indicator.svg', alt: 'spinner' })
      ]) :
      h(GoogleLogin, {
        scope: 'openid email profile',
        theme: 'dark',
        clientId: this.state.clientId,
        onSuccess: this.responseGoogle,
        onFailure: this.forbidden,
        disabledStyle: { 'opacity': '25%', 'cursor': 'not-allowed' },
      });
  };

  render() {

    let googleLoginButton;

    if (this.state.clientId === '') {
      googleLoginButton = div({ style: { 'position': 'absolute', 'top': '45px', 'right': '45px', 'zIndex': '10000' } }, [
        img({ src: '/images/loading-indicator.svg', alt: 'spinner' })
      ]);
    } else {
      googleLoginButton = h(GoogleLogin, {
        scope: 'openid email profile',
        clientId: this.state.clientId,
        onSuccess: this.responseGoogle,
        onFailure: this.forbidden,
        render: ({disabled}) => this.renderSpinnerIfDisabled(disabled)
        }
      );
    }

    return (
      div({}, [
        div({ isRendered: !_.isEmpty(this.state.error), className: 'dialog-alert' }, [
          Alert({
            id: 'dialog',
            type: 'danger',
            title: this.state.error.title,
            description: this.state.error.description
          })
        ]),
        div({ isRendered: _.isEmpty(this.state.error) }, [googleLoginButton])
      ])
    );
  }
});
