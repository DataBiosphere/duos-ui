import React, { useState, useEffect } from 'react';
import { a, div, button, label, h, h2, h3, h4, span } from 'react-hyperscript-helpers';
import { get, merge } from 'lodash';
import { find, getOr, isNil } from 'lodash/fp';
import * as qs from 'query-string';
import { AuthenticateNIH, User, Collections } from '../libs/ajax';
import { Config } from '../libs/config';
import eraIcon from '../images/era-commons-logo.png';
import './Animations.css';

export default function ERACommons(props) {
  const [state, setState] = useState({
    isAuthorized: false,
    expirationCount: 0,
    eraCommonsId: '',
    nihError: false,
    isHovered: false
  });

  const onMouseEnter = () => {
    setState({ ...state, isHovered: true });
  };

  const onMouseLeave = () => {
    setState({ ...state, isHovered: false });
  };

  const saveNIHAuthentication = async (searchArg) => {
    const parsedToken = qs.parse(searchArg);
    try {
      const decodedNihAccount = await verifyToken(parsedToken);
      await AuthenticateNIH.saveNihUsr(decodedNihAccount);
      await getUserInfo();
    } catch (error) {
      setState({ ...state, nihError: true });
    }
  };

  const getUserInfo = async () => {
    try {
      const response = (props.researcherProfile === undefined) ? await User.getMe() : props.researcherProfile;
      const propsData = response.researcherProperties;
      const authProp = find({ 'propertyKey': 'eraAuthorized' })(propsData);
      const expProp = find({ 'propertyKey': 'eraExpiration' })(propsData);
      const isAuthorized = isNil(authProp) ? false : getOr(false, 'propertyValue')(authProp);
      const expirationCount = isNil(expProp) ? 0 : AuthenticateNIH.expirationCount(getOr(0, 'propertyValue')(expProp));
      const nihValid = isAuthorized && expirationCount > 0;
      const eraCommonsId = response.eraCommonsId;

      props.onNihStatusUpdate(nihValid);
      setState({
        ...state,
        isAuthorized,
        expirationCount,
        eraCommonsId: isNil(eraCommonsId) ? '' : eraCommonsId
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const verifyToken = async (parsedToken) => {
    try {
      const decoded = await AuthenticateNIH.verifyNihToken(parsedToken);
      return decoded;
    } catch (error) {
      setState({ ...state, nihError: true });
      return null;
    }
  };

  const redirectToNihLogin = async () => {
    const destination = `${window.location.origin}/${props.destination}?nih-username-token=<token>`;
    const nihUrl = `${await Config.getNihUrl()}?${qs.stringify({ 'return-url': destination })}`;
    window.location.href = nihUrl;
  };

  const deleteNihAccount = async () => {
    try {
      await AuthenticateNIH.eliminateAccount();
      await getUserInfo();
    } catch (error) {
      setState({ ...state, nihError: true });
    }
  };

  useEffect(() => {
    if (props.location !== undefined && props.location.search !== '') {
      saveNIHAuthentication(props.location.search);
    } else {
      getUserInfo();
      console.log('here')
    }
  }, [props.location, props.researcherProfile]);

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
    fontSize: '.8em',
    transition: 'all .2s ease'
  };
  const validationErrorState = get(props, 'validationError', false) ? {
    color: '#D13B07'
  } : {};
  const buttonStyle =
    merge(state.isHovered ? merge(buttonNormalState, buttonHoverState) : buttonNormalState, validationErrorState);
  const nihErrorMessage = 'Something went wrong. Please try again.';

  return (
    div({
      className: props.className,
      style: { minHeight: 65, ...props.style }
    }, [
      label(
        { className: 'control-label', isRendered: props.header },
        [
          span({}, [
            'NIH eRA Commons ID',
            isNil(props.required) || props.required === true ? '*' : ''
          ])
        ]),
      div({
        isRendered: (!state.isAuthorized || state.expirationCount < 0)
      }, [
        a({
          style: buttonStyle,
          onMouseEnter: onMouseEnter,
          onMouseLeave: onMouseLeave,
          onClick: redirectToNihLogin,
          disabled: props.readOnly,
          target: '_blank'
        }, [
          div({ style: logoStyle }),
          span({ style: { verticalAlign: '50%' } }, ['Authenticate your account'])
        ])
      ]),
      span({
        className: 'cancel-color required-field-error-span',
        isRendered: state.nihError
      }, [nihErrorMessage]),
      div({ isRendered: (state.isAuthorized) }, [
        div({
          isRendered: state.expirationCount >= 0,
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding'
        }, [
          div({
            style: {
              float: 'left',
              fontWeight: 500,
              display: 'inline',
              paddingTop: 5
            }
          }, [state.eraCommonsId]),
          button({
            style: {
              float: 'left',
              margin: '2px 0 0 10px'
            },
            type: 'button',
            disabled: props.readOnly,
            onClick: deleteNihAccount,
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
          div({ isRendered: state.expirationCount >= 0, className: 'fadein' }, ['Your NIH authentication will expire in ' + state.expirationCount + ' days']),
          div({ isRendered: state.expirationCount < 0, className: 'fadein' }, [(props.researcherProfile === undefined) ? 'Your NIH authentication has expired' : `This user's NIH authentication has expired`])
        ])
      ])
    ])
  );
}
