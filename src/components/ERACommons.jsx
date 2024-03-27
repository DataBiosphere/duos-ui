import React, {useEffect, useCallback, useState} from 'react';
import {get, isEmpty} from 'lodash';
import {isNil} from 'lodash/fp';
import queryString from 'query-string';
import './ERACommons.css';
import {AuthenticateNIH, User} from '../libs/ajax';
import {Config} from '../libs/config';
import './Animations.css';
import {decodeNihToken, extractEraAuthenticationState} from '../../src/utils/ERACommonsUtils';

export default function ERACommons(props) {

  const [header] = useState(props.header || false);
  const [required] = useState(props.required || false);
  const [destination] = useState(props.destination || '');
  const [researcherProfile] = useState(props.researcherProfile || {});
  const [readOnly] = useState(props.readOnly || false);
  const [search, setSearch] = useState(props.location?.search || '');
  const [isAuthorized, setAuthorized] = useState(false);
  const [expirationCount, setExpirationCount] = useState(0);
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [nihError, setNihError] = useState(false);

  const nihStatusUpdate = useCallback((val) => {
    props.onNihStatusUpdate(val);
  }, [props]);

  /**
   * This hook is called only when the user is redirected back to the original page after authenticating with NIH.
   */
  useEffect(() => {
    // If we have a token to verify, save it before getting user info
    const initEraAuthSuccess = async () => {
      if (search !== '') {
        const rawToken = queryString.parse(search);
        const decodedToken = await decodeNihToken(rawToken);
        if (isNil(decodedToken)) {
          setNihError(true);
          return;
        }
        // Rewrite the payload to match the expected format in Consent, so we can save the values on the back end.
        const nihPayload = {
          'linkedNihUsername': `${decodedToken.eraCommonsUsername}`,
          'linkExpireTime': `${decodedToken.exp}`,
          'status': true
        };
        const newUserProps = await AuthenticateNIH.saveNihUsr(nihPayload);
        const eraAuthState = extractEraAuthenticationState(newUserProps);
        setAuthorized(eraAuthState.isAuthorized);
        setExpirationCount(eraAuthState.expirationCount);
        setEraCommonsId(decodedToken.eraCommonsUsername);
        nihStatusUpdate(eraAuthState.nihValid);
        document.getElementById('era-commons-id').scrollIntoView({block: 'start', inline: 'nearest', behavior: 'smooth'});
      }
    };
    initEraAuthSuccess();
  }, [nihStatusUpdate, search]);

  /**
   * This will populate state from either the provided researcher object or the current user.
   */
  useEffect(() => {
    const initResearcherProfile = async () => {
      if (readOnly && !isEmpty(researcherProfile)) {
        // In the read-only case, we are provided a researcher object and do not need to query for the current user.
        const eraAuthState = extractEraAuthenticationState(researcherProfile.properties);
        setAuthorized(eraAuthState.isAuthorized);
        setExpirationCount(eraAuthState.expirationCount);
        setEraCommonsId(researcherProfile.eraCommonsId);
        nihStatusUpdate(eraAuthState.nihValid);
      } else {
        // In the non-read-only state, we are querying for the current user's properties.
        const response = await User.getMe();
        const eraAuthState = extractEraAuthenticationState(response.researcherProperties);
        setAuthorized(eraAuthState.isAuthorized);
        setExpirationCount(eraAuthState.expirationCount);
        setEraCommonsId(response.eraCommonsId);
        nihStatusUpdate(eraAuthState.nihValid);
      }
    };
    initResearcherProfile();
  }, [readOnly, researcherProfile, nihStatusUpdate]);

  const redirectToNihLogin = async () => {
    const returnUrl = window.location.origin + '/' + destination + '?nih-username-token=<token>';
    window.location.href = `${ await Config.getNihUrl() }?${queryString.stringify({ 'return-url': returnUrl })}`;
  };

  const deleteNihAccount = async () => {
    const deleteResponse = await AuthenticateNIH.deleteAccountLinkage();
    if (deleteResponse) {
      const response = await User.getMe();
      const eraAuthState = extractEraAuthenticationState(response.researcherProperties);
      setAuthorized(eraAuthState.isAuthorized);
      setExpirationCount(eraAuthState.expirationCount);
      setEraCommonsId(researcherProfile.eraCommonsId);
      nihStatusUpdate(eraAuthState.nihValid);
      setSearch('');
    } else {
      setNihError(true);
      document.getElementById('era-commons-id').scrollIntoView({block: 'start', inline: 'nearest', behavior: 'smooth'});
    }
  };

  const validationErrorState = get(props, 'validationError', false);
  const nihErrorMessage = 'Something went wrong. Please try again.';

  return (
    <div id={'era-commons-id'} style={{ minHeight: 65 }}>
      {header && <label className="era-control-label">
        <span data-cy="era-commons-header">NIH eRA Commons ID
          {required ? <span data-cy="era-commons-required">*</span> : ''}
        </span>
      </label>}
      {(!isAuthorized || expirationCount < 0) && (!readOnly &&
          <a
            data-cy="era-commons-authenticate-link"
            className={validationErrorState ? 'era-button-state-error' : 'era-button-state'}
            onClick={redirectToNihLogin}
            target="_blank">
            <div className={'era-logo-style'}/>
            <span style={{verticalAlign: '50%'}}>Authenticate your account</span>
          </a>
      )}
      {nihError && <span className="cancel-color required-field-error-span">{nihErrorMessage}</span>}
      {isAuthorized && <div>
        {expirationCount >= 0 && <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding">
          <div data-cy="era-commons-id-value" style={{ float: 'left', fontWeight: 500, display: 'inline', paddingTop: 5 }}>{eraCommonsId}</div>
          {!readOnly && <button style={{ float: 'left', margin: '2px 0 0 10px' }} type="button" onClick={deleteNihAccount} className="close">
            <span className="glyphicon glyphicon-remove-circle" data-tip="Clear account" data-for="tip_clearNihAccount" />
          </button>}
        </div>}
        <div style={{ marginTop: 8, fontStyle: 'italic', display: 'block' }} className="col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding">
          {expirationCount >= 0 && <div className="era-fadein">{`${readOnly ? 'This user\'s' : 'Your'} NIH authentication will expire in ${expirationCount} days`}</div>}
          {expirationCount < 0 && <div className="era-fadein">{`${readOnly ? 'This user\'s' : 'Your'} NIH authentication has expired`}</div>}
        </div>
      </div>}
    </div>
  );
}
