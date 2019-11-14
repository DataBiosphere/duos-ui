import _ from 'lodash';
import React from 'react';
import { a, button, div, hh, label, span } from 'react-hyperscript-helpers';
import { Storage } from '../libs/storage';
import { AuthenticateNIH, Researcher } from '../libs/ajax';
import { Config } from '../libs/config';


export const eRACommons = hh(class eRACommons extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      rpProperties: props.rpProperties,
      nihError: false,
      nihErrorMessage: 'Something went wrong. Please try again. '
    };
    this.redirectToNihLogin = this.redirectToNihLogin.bind(this);
    this.deleteNihAccount = this.deleteNihAccount.bind(this);
  };

  isAuthorized = () => {
    return _.isNil(this.props.rpProperties.eraAuthorized) ? false : JSON.parse(this.props.rpProperties.eraAuthorized);
  };

  expirationCount = () => {
    return _.isNil(this.props.rpProperties.eraExpiration) ? 0 : AuthenticateNIH.expirationCount(this.props.rpProperties.eraExpiration);
  };

  nihUsername = () => {
    return _.isNil(this.props.rpProperties.nihUsername) ? '' : this.props.rpProperties.nihUsername;
  };

  async verifyToken(parsedToken) {
    return await AuthenticateNIH.verifyNihToken(parsedToken).then(
      (decoded) => decoded,
      (error) => {
        this.setState({ nihError: true });
        return null;
      }
    );
  }

  async redirectToNihLogin() {
    const nihUrl = `${ await Config.getNihUrl() }?redirect-url=`;
    const landingUrl = nihUrl.concat(window.location.origin + '/' + this.props.destination + '?jwt%3D%7Btoken%7D');
    // Storage.setData('dar_application', this.state.formData);
    window.location.href = landingUrl;
  }

  async deleteNihAccount() {
    AuthenticateNIH.eliminateAccount().then(result => {
      this.setState(prev => {
        prev.rpProperties = Researcher.getPropertiesByResearcherId(Storage.getCurrentUser().dacUserId);
        // prev.eraAuthorized = false;
        return prev;
      });
    });
  }

  render() {
    return (
      div({ className: this.props.className }, [
        label({ className: 'control-label' }, ['NIH eRA Commons ID']),
        div({ isRendered: (!this.isAuthorized() || this.expirationCount() < 0) }, [
          a({ onClick: this.redirectToNihLogin, target: '_blank', className: 'auth-button ERACommons' }, [
            div({ className: 'logo' }, []),
            span({}, ['Authenticate your account'])
          ])
        ]),
        span({
          className: 'cancel-color required-field-error-span',
          isRendered: this.state.nihError
        }, [this.state.nihErrorMessage]),
        div({ isRendered: (this.isAuthorized()) }, [
          div({
            isRendered: this.expirationCount() >= 0,
            className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding'
          }, [
            div({ className: 'auth-id' }, [this.nihUsername()]),
            button({ type: 'button', onClick: this.deleteNihAccount, className: 'close auth-clear' }, [
              span({ className: 'glyphicon glyphicon-remove-circle', 'data-tip': 'Clear account', 'data-for': 'tip_clearNihAccount' })
            ])
          ]),
          div({ className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding auth-message' }, [
            div({ isRendered: this.expirationCount() >= 0 }, ['Your NIH authentication will expire in ' + this.expirationCount() + ' days']),
            div({ isRendered: this.expirationCount() < 0 }, ['Your NIH authentication has expired'])
          ])
        ])
      ])
    );
  }
});
