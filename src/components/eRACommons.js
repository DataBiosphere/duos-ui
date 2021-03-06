import {get, isNil, isUndefined, merge } from 'lodash';
import { find, getOr } from 'lodash/fp';
import * as qs from 'query-string';
import React from 'react';
import { a, button, div, hh, label, span } from 'react-hyperscript-helpers';
import { AuthenticateNIH, User } from '../libs/ajax';
import { Config } from '../libs/config';
import eraIcon from "../images/era-commons-logo.png";

export const eRACommons = hh(class eRACommons extends React.Component {

  state = {
    isAuthorized: false,
    expirationCount: 0,
    nihUsername: '',
    nihError: false,
    isHovered: false
  };

  componentDidMount = async () => {
    if (this.props.location !== undefined && this.props.location.search !== '') {
      await this.authenticateAsNIHFCUser(this.props.location.search);
    } else {
      await this.getUserInfo();
    }
  };

  onMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  onMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  authenticateAsNIHFCUser = async (searchArg) => {
    let isFcUser = await this.verifyUser();
    if (!isFcUser) {
      await User.getMe().then(
        (response) => isFcUser = this.registerUserToFC(response),
        () => this.setState({ nihError: true })
      );
    }
    if (isFcUser) {
      const parsedToken = qs.parse(searchArg);
      this.verifyToken(parsedToken).then(
        (decodedNihAccount) => {
          AuthenticateNIH.saveNihUsr(decodedNihAccount).then(
            () => this.getUserInfo(),
            () => this.setState({ nihError: true })
          );
        },
        () => this.setState({ nihError: true })
      );
    }
  };

  getUserInfo = async () => {
    User.getMe().then((response) => {
      const props = response.researcherProperties;
      const authProp = find({'propertyKey':'eraAuthorized'})(props);
      const expProp = find({'propertyKey':'eraExpiration'})(props);
      const isAuthorized = isNil(authProp) ? false : getOr(false,'propertyValue')(authProp);
      const expirationCount = isNil(expProp) ? 0 : AuthenticateNIH.expirationCount(getOr(0,'propertyValue')(expProp));
      const nihValid = isAuthorized && expirationCount > 0;
      const nihUsernameProp = find({'propertyKey':'nihUsername'})(props);
      this.props.onNihStatusUpdate(nihValid);
      this.setState(prev => {
        prev.isAuthorized = isAuthorized;
        prev.expirationCount = expirationCount;
        prev.nihUsername = isNil(nihUsernameProp) ? '' : getOr('', 'propertyValue')(nihUsernameProp);
        return prev;
      });
    });
  };

  verifyToken = async (parsedToken) => {
    return await AuthenticateNIH.verifyNihToken(parsedToken).then(
      (decoded) => decoded,
      () => {
        this.setState({ nihError: true });
        return null;
      }
    );
  };

  verifyUser = async () => {
    const isFcUser = await AuthenticateNIH.fireCloudVerifyUser().catch(
      () => {
        this.setState({ nihError: true });
        return false;
      });
    if (isUndefined(isFcUser)) { return false; }
    return get(isFcUser, 'enabled.google', false);
  };

  registerUserToFC = async (properties) => {
    return await AuthenticateNIH.fireCloudRegisterUser(properties).then(
      () => true,
      () => {
        this.setState({ nihError: true });
        return false;
      });
  };

  redirectToNihLogin = async () => {
    const destination = window.location.origin + '/' + this.props.destination + '?nih-username-token=<token>';
    const nihUrl = `${ await Config.getNihUrl() }?${qs.stringify({ 'return-url': destination })}`;
    window.location.href = nihUrl;
  };

  deleteNihAccount = async () => {
    AuthenticateNIH.eliminateAccount().then(
      () => this.getUserInfo(),
      () => this.setState({ nihError: true })
    );
  };

  render() {
    const logoStyle = {
      height: 27,
      width: 38,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundImage: `url(${eraIcon})`,
      display: 'inline-block'
    };
    const buttonHoverState = {
      boxShadow: '1px 1px 3px #00609f'
    };
    const buttonNormalState = {
      height: 34,
      width: 210,
      display: 'block',
      border: '1px solid #d3d3d3',
      padding: 3,
      textAlign: 'center',
      marginTop: 3,
      backgroundColor: '#fff',
      borderRadius: 2,
      boxShadow: '1px 1px 3px #999999',
      cursor: 'pointer',
      color: '#999',
      fontWeight: 500,
      fontSize: '.9em',
      transition: 'all .2s ease'
    };
    const validationErrorState = get(this.props, 'validationError', false) ? {
      color: '#D13B07'
    } : {};
    const buttonStyle =
      merge(this.state.isHovered ? merge(buttonNormalState, buttonHoverState) : buttonNormalState, validationErrorState);
    const nihErrorMessage = 'Something went wrong. Please try again.';

    return (
      div({ className: this.props.className }, [
        label({ className: 'control-label' }, ['NIH eRA Commons ID*']),
        div({
          isRendered: (!this.state.isAuthorized || this.state.expirationCount < 0)
        }, [
          a({
            style: buttonStyle,
            onMouseEnter: this.onMouseEnter,
            onMouseLeave: this.onMouseLeave,
            onClick: this.redirectToNihLogin,
            target: '_blank'
          }, [
            div({ style: logoStyle }),
            span({ style: { verticalAlign: '50%' } }, ['Authenticate your account'])
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
            div({
              style: {
                float: 'left',
                fontWeight: 500,
                display: 'inline',
                paddingTop: 5
              }
            }, [this.state.nihUsername]),
            button({
              style: {
                float: 'left',
                margin: '2px 0 0 10px'
              },
              type: 'button',
              onClick: this.deleteNihAccount,
              className: 'close'
            }, [
              span({ className: 'glyphicon glyphicon-remove-circle', 'data-tip': 'Clear account', 'data-for': 'tip_clearNihAccount' })
            ])
          ]),
          div({
            style: {
              marginTop: 8,
              fontStyle: 'italic',
              display: 'block'
            },
            className: 'col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding'
          }, [
            div({ isRendered: this.state.expirationCount >= 0 }, ['Your NIH authentication will expire in ' + this.state.expirationCount + ' days']),
            div({ isRendered: this.state.expirationCount < 0 }, ['Your NIH authentication has expired'])
          ])
        ])
      ])
    );
  }
});
