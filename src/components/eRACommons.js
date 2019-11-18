import _ from 'lodash';
import * as qs from 'query-string';
import React from 'react';
import { a, button, div, hh, label, span } from 'react-hyperscript-helpers';
import { AuthenticateNIH, Researcher } from '../libs/ajax';
import { Config } from '../libs/config';
import { Storage } from '../libs/storage';


export const eRACommons = hh(class eRACommons extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isAuthorized: false,
      expirationCount: 0,
      nihUsername: '',
      nihError: false
    };
    this.authenticateAsNIHFCUser = this.authenticateAsNIHFCUser.bind(this);
    this.getResearcherProperties = this.getResearcherProperties.bind(this);
    this.verifyToken = this.verifyToken.bind(this);
    this.verifyUser = this.verifyUser.bind(this);
    this.registerUserToFC = this.registerUserToFC.bind(this);
    this.redirectToNihLogin = this.redirectToNihLogin.bind(this);
    this.deleteNihAccount = this.deleteNihAccount.bind(this);
  };

  async componentDidMount() {
    if (this.props.location !== undefined && this.props.location.search !== '') {
      this.authenticateAsNIHFCUser(this.props.location.search);
    } else {
      this.getResearcherProperties();
    }
  }

  async authenticateAsNIHFCUser(searchArg) {
    const currentUserId = Storage.getCurrentUser().dacUserId;
    let isFcUser = this.verifyUser();
    if (!isFcUser) {
      Researcher.getPropertiesByResearcherId(currentUserId).then(
        (response) => isFcUser = this.registerUserToFC(response),
        () => this.setState({ nihError: true })
      );
    }
    if (isFcUser) {
      const parsedToken = qs.parse(searchArg);
      this.verifyToken(parsedToken).then(
        (decodedNihAccount) => {
          AuthenticateNIH.saveNihUsr(decodedNihAccount).then(
            () => this.getResearcherProperties(),
            () => this.setState({ nihError: true })
          );
        },
        () => this.setState({ nihError: true })
      );
    }
  };

  async getResearcherProperties() {
    const currentUserId = Storage.getCurrentUser().dacUserId;
    Researcher.getPropertiesByResearcherId(currentUserId).then(response => {
      const isAuthorized = _.isNil(response.eraAuthorized) ? false : JSON.parse(response.eraAuthorized);
      const expirationCount = _.isNil(response.eraExpiration) ? 0 : AuthenticateNIH.expirationCount(response.eraExpiration);
      const nihValid = isAuthorized && expirationCount > 0;
      this.props.onNihStatusUpdate(nihValid);
      this.setState(prev => {
        prev.isAuthorized = isAuthorized;
        prev.expirationCount = expirationCount;
        prev.nihUsername = _.isNil(response.nihUsername) ? '' : response.nihUsername;
        return prev;
      });
    });
  }

  async verifyToken(parsedToken) {
    return await AuthenticateNIH.verifyNihToken(parsedToken).then(
      (decoded) => decoded,
      () => {
        this.setState({ nihError: true });
        return null;
      }
    );
  }

  async verifyUser() {
    const isFcUser = await AuthenticateNIH.fireCloudVerifyUser().catch(
      () => {
        this.setState({ nihError: true });
        return false;
      });
    return isFcUser !== undefined && isFcUser !== false && isFcUser.enabled.google === true;
  }

  async registerUserToFC(properties) {
    return await AuthenticateNIH.fireCloudRegisterUser(properties).then(
      () => true,
      () => {
        this.setState({ nihError: true });
        return false;
      });
  }

  async redirectToNihLogin() {
    const nihUrl = `${ await Config.getNihUrl() }?redirect-url=`;
    window.location.href = nihUrl.concat(window.location.origin + '/' + this.props.destination + '?jwt%3D%7Btoken%7D');
  }

  async deleteNihAccount() {
    AuthenticateNIH.eliminateAccount().then(
      () => this.getResearcherProperties(),
      () => this.setState({ nihError: true })
    );
  }

  render() {
    const validationErrorStyle = _.isNil(this.props.validationError) ? {} : {
      color: "#D13B07",
      border: "1px solid #D13B07",
      borderRadius: 5,
      padding: 6
    };
    const nihErrorMessage = 'Something went wrong. Please try again.';
    return (
      div({ className: this.props.className }, [
        label({ className: 'control-label' }, ['NIH eRA Commons ID']),
        div({ isRendered: (!this.state.isAuthorized || this.state.expirationCount < 0) }, [
          a({ onClick: this.redirectToNihLogin, target: '_blank', className: 'auth-button ERACommons' }, [
            div({style: validationErrorStyle}, [
              span({}, ['Authenticate your account'])
            ]),
          ])
        ]),
        span({
          className: 'cancel-color required-field-error-span',
          isRendered: this.state.nihError
        }, [nihErrorMessage]),
        div({ isRendered: (this.state.isAuthorized) }, [
          div({
            isRendered: this.state.expirationCount >= 0,
            className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding'
          }, [
            div({ className: 'auth-id' }, [this.state.nihUsername]),
            button({ type: 'button', onClick: this.deleteNihAccount, className: 'close auth-clear' }, [
              span({ className: 'glyphicon glyphicon-remove-circle', 'data-tip': 'Clear account', 'data-for': 'tip_clearNihAccount' })
            ])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding auth-message' }, [
            div({ isRendered: this.state.expirationCount >= 0 }, ['Your NIH authentication will expire in ' + this.state.expirationCount + ' days']),
            div({ isRendered: this.state.expirationCount < 0 }, ['Your NIH authentication has expired'])
          ])
        ])
      ])
    );
  }
});
