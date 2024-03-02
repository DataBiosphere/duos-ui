import React, {useEffect, useState} from 'react';
import {get, merge} from 'lodash';
import {find, getOr, isNil} from 'lodash/fp';
import * as qs from 'query-string';
import {AuthenticateNIH, User} from '../libs/ajax';
import {Config} from '../libs/config';
import eraIcon from '../images/era-commons-logo.png';
import './Animations.css';
import {decodeNihToken, expirationCountFromDate} from '../../src/utils/ERACommonsUtils';

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
        if (isNil(decodedToken)) {
          setNihError(true);
          return;
        }
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
        document.getElementById('era-commons-id').scrollIntoView(
          {block: 'start', inline: 'nearest', behavior: 'smooth'}
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
    const expirationCount = isNil(expProp) ? 0 : expirationCountFromDate(getOr(0,'propertyValue')(expProp));
    const nihValid = isAuthorized && expirationCount > 0;
    const eraCommonsId = response.eraCommonsId;
    props.onNihStatusUpdate(nihValid);
    setAuthorized(isAuthorized);
    setExpirationCount(expirationCount);
    setEraCommonsId(isNil(eraCommonsId) ? '' : eraCommonsId);
  };

  const redirectToNihLogin = async () => {
    const destination = window.location.origin + '/' + props.destination + '?nih-username-token=<token>';
    const nihUrl = `${ await Config.getNihUrl() }?${qs.stringify({ 'return-url': destination })}`;
    window.location.href = nihUrl;
  };

  const deleteNihAccount = async () => {
    AuthenticateNIH.deleteAccountLinkage().then(
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
    <div id={'era-commons-id'} className={props.className} style={{ minHeight: 65, ...props.style }}>
      {props.header && <label className="control-label">
        <span>NIH eRA Commons ID
          {isNil(props.required) || props.required === true ? '*' : ''}
        </span>
      </label>}
      {(!isAuthorized || expirationCount < 0) && (!props.readOnly &&
    <a style={buttonStyle} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={redirectToNihLogin} target="_blank">
      <div style={logoStyle} />
      <span style={{ verticalAlign: '50%' }}>Authenticate your account</span>
    </a>
      )}
      {nihError && <span className="cancel-color required-field-error-span">{nihErrorMessage}</span>}
      {isAuthorized && <div>
        {expirationCount >= 0 && <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
          <div style={{ float: 'left', fontWeight: 500, display: 'inline', paddingTop: 5 }}>{eraCommonsId}</div>
          {!props.readOnly && <button style={{ float: 'left', margin: '2px 0 0 10px' }} type="button" onClick={deleteNihAccount} className="close">
            <span className="glyphicon glyphicon-remove-circle" data-tip="Clear account" data-for="tip_clearNihAccount" />
          </button>}
        </div>}
        <div style={{ marginTop: 8, fontStyle: 'italic', display: 'block' }} className="col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding">
          {expirationCount >= 0 && <div className="fadein">{`${props.readOnly ? 'This user\'s' : 'Your'} NIH authentication will expire in ${expirationCount} days`}</div>}
          {expirationCount < 0 && <div className="fadein">{`${props.readOnly ? 'This user\'s' : 'Your'} NIH authentication has expired`}</div>}
        </div>
      </div>}
    </div>
  );
}
