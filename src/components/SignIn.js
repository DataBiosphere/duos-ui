import _ from 'lodash/fp';
import { Component } from 'react';
import GoogleLogin from 'react-google-login';
import { div, h, hh, img, span, button } from 'react-hyperscript-helpers';
import { Alert } from './Alert';
import { User } from '../libs/ajax';
import { Config } from '../libs/config';
import { Storage } from '../libs/storage';
import { Navigation, setUserRoleStatuses } from '../libs/utils';
import loadingIndicator from '../images/loading-indicator.svg';
export const SignIn = hh(class SignIn extends Component {

  constructor(props) {
    super(props);
    this.state = {
      clientId: '',
      error: {},
    };
    this.getGoogleClientId();
  }

  getGoogleClientId = async () => {
    const clientKey = `${ await Config.getGoogleClientId() }`;
    this.setState(prev => {
      prev.clientId = clientKey;
      return prev;
    });
  };

  getUser = async () => {
    return await User.getMe();
  };

  responseGoogle = async (response) => {
    Storage.setGoogleData(response);
    try{
      const userRes = await this.getUser();
      const user = Object.assign(userRes, setUserRoleStatuses(userRes, Storage));
      this.redirect(user);
    } catch(error) {
      try {
        let registeredUser = await User.registerUser();
        this.setUserRoleStatuses(registeredUser, Storage);
        this.props.onSignIn(); //is this async?
        this.props.history.push('/profile');
      } catch(error) {
        try{
          const status = error.status;
          switch(status) {
            case 400:
              this.setState(prev => {
                prev.error = {show: true, title: 'Error', msg: JSON.stringify(error)};
                return prev;
              });
              break;
            case 409:
              try {
                let user = await this.getUser();
                user = Object.assign({}, user, setUserRoleStatuses(user, Storage));
                this.redirect(user);
              } catch(error) {
                Storage.clearStorage();
              }
              break;
            default:
              this.setState(prev => {
                prev.error = { show: true, title: 'Error', msg: 'Unexpected error, please try again'};
                return prev;
              });
              break;
          }
        } catch(error) {
          this.setState(prev => {
            prev.error = {show: true, title: 'Error', msg: JSON.stringify(error)};
            return prev;
          });
        }
      }
    }
  };

  forbidden = (response) => {
    Storage.clearStorage();
    if (response.error === 'popup_closed_by_user') {
      this.setState(prev => {
        prev.error = {
          description: span({}, ['Sign-in cancelled ... ', img({ height: '20px', src: loadingIndicator })])
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
    Navigation.back(user, this.props.history);
    this.props.onSignIn();
  };

  renderSpinnerIfDisabled = (disabled) => {
    const defaultStyle = {
      scope: 'openid email profile',
      height: '44px',
      width: '180px',
      theme: 'dark',
      clientId: this.state.clientId,
      onSuccess: this.responseGoogle,
      onFailure: this.forbidden,
      disabledStyle: { 'opacity': '25%', 'cursor': 'not-allowed' }
    };
    return disabled ?
      div({ style: { textAlign: 'center', height: '44px', width: '180px' } }, [
        img({ src: loadingIndicator, alt: 'spinner' })
      ]) :
      h(GoogleLogin,
        _.isNil(this.props.customStyle) ? defaultStyle : {
          render: (props) => button({className: 'btn-primary', onClick: props.onClick, style: this.props.customStyle}, 'Submit a Data Access Request'),
          ...defaultStyle
        });
  };

  render() {

    let googleLoginButton;

    if (this.state.clientId === '') {
      googleLoginButton = div({ style: { textAlign: 'center', height: '44px', width: '180px' } }, [
        img({ src: loadingIndicator, alt: 'spinner' })
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
