import {useEffect, useState} from 'react';
import {get, merge} from 'lodash';
import {find, getOr, isNil} from 'lodash/fp';
import * as qs from 'query-string';
import {a, button, div, label, span} from 'react-hyperscript-helpers';
import {AuthenticateNIH, User} from '../libs/ajax';
import {Buffer} from 'buffer';
import {Config} from '../libs/config';
import eraIcon from '../images/era-commons-logo.png';
import './Animations.css';

export default function ERACommons(props) {

  const [isAuthorized, setAuthorized] = useState(false);
  const [expirationCount, setExpirationCount] = useState(0);
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [nihError, setNihError] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [researcherProfile, setResearcherProfile] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      // If we have a token to verify, save it before getting user info
      if (props.location !== undefined && props.location.search !== '') {
        await saveNIHAuthentication(props.location.search);
      }
      await getUserInfo();
    };
    fetchData();
    // Note that we do not want props.location as a dependency here since it does not change after render.
  }, []);

  const onMouseEnter = () => {
    setHovered(true);
  };

  const onMouseLeave = () => {
    setHovered(false);
  };

  const saveNIHAuthentication = async (searchArg) => {
    const rawToken = qs.parse(searchArg);
    await decodeNihToken(rawToken).then(
      (decodedToken) => {
        // We need to rewrite the payload to match the expected format in Consent.
        const nihPayload = {
          'linkedNihUsername': `${decodedToken.eraCommonsUsername}`,
          'linkExpireTime': `${decodedToken.exp}`,
          'status': true
        };
        AuthenticateNIH.saveNihUsr(nihPayload).then(
          () => getUserInfo(),
          () => setNihError(true)
        );
      },
      () => setNihError(true)
    );
  };

  const getUserInfo = async () => {
    const response = props.readOnly ? researcherProfile : await User.getMe();
    const propsData = response.researcherProperties;
    const authProp = find({'propertyKey':'eraAuthorized'})(propsData);
    const expProp = find({'propertyKey':'eraExpiration'})(propsData);
    const isAuthorized = isNil(authProp) ? false : getOr(false,'propertyValue')(authProp);
    const expirationCount = isNil(expProp) ? 0 : AuthenticateNIH.expirationCount(getOr(0,'propertyValue')(expProp));
    const nihValid = isAuthorized && expirationCount > 0;
    const eraCommonsId = response.eraCommonsId;
    props.onNihStatusUpdate(nihValid);
    setAuthorized(isAuthorized);
    setExpirationCount(expirationCount);
    setEraCommonsId(isNil(eraCommonsId) ? '' : eraCommonsId);
  };

  /*
  * This function is used to verify the raw NIH token and return the decoded data.
  * It takes in a base64 encoded token, splits it into the following components:
  * {"alg":"RS256","typ":"JWT"}
  * {"eraCommonsUsername":"USERNAME","iat":1709307111,"exp":1709310711}
  * <... a chunk of binary data we don't care about ...>
  * all in a single concatenated string. We then split the string into the parts we
  * care about and parse the era commons part as a JSON object.
 */
  const decodeNihToken = async (token) => {
    const rawToken = get('nih-username-token')(token);
    try {
      const bufferString = Buffer.from(rawToken, 'base64').toString('utf8');
      // We want the JSON components, so introduce a delimiter to split on
      const splittableBufferString = bufferString.replaceAll('}', '}|');
      const parts = splittableBufferString.split('|');
      // Something is wrong - we should have at least 2 parts
      if (parts.length < 2) {
        return null;
      }
      return JSON.parse(parts[1]);
    } catch (err) {
      setNihError(true);
      return null;
    }
  };

  const redirectToNihLogin = async () => {
    const destination = window.location.origin + '/' + props.destination + '?nih-username-token=<token>';
    const nihUrl = `${ await Config.getNihUrl() }?${qs.stringify({ 'return-url': destination })}`;
    window.location.href = nihUrl;
  };

  const deleteNihAccount = async () => {
    AuthenticateNIH.eliminateAccount().then(
      () => getUserInfo(),
      () => setNihError(true)
    );
  };

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
    merge(hovered ? merge(buttonNormalState, buttonHoverState) : buttonNormalState, validationErrorState);
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
        isRendered: (!isAuthorized || expirationCount < 0)
      }, [
        !props.readOnly && a({
          style: buttonStyle,
          onMouseEnter: onMouseEnter,
          onMouseLeave: onMouseLeave,
          onClick: redirectToNihLogin,
          target: '_blank'
        }, [
          div({ style: logoStyle }),
          span({ style: { verticalAlign: '50%' } }, ['Authenticate your account'])
        ])
      ]),
      span({
        className: 'cancel-color required-field-error-span',
        isRendered: nihError
      }, [nihErrorMessage]),
      div({ isRendered: (isAuthorized) }, [
        div({
          isRendered: expirationCount >= 0,
          className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding'
        }, [
          div({
            style: {
              float: 'left',
              fontWeight: 500,
              display: 'inline',
              paddingTop: 5
            }
          }, [eraCommonsId]),
          !props.readOnly && button({
            style: {
              float: 'left',
              margin: '2px 0 0 10px'
            },
            type: 'button',
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
          div({ isRendered: expirationCount >= 0, className: 'fadein' }, [`${props.readOnly ? 'This user\'s' : 'Your'} NIH authentication will expire in ${expirationCount} days`]),
          div({ isRendered: expirationCount < 0, className: 'fadein' }, [`${props.readOnly ? 'This user\'s' : 'Your'} NIH authentication has expired`])
        ])
      ])
    ])
  );
}
