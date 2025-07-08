import React, {useEffect, useState} from 'react';
import {get} from 'lodash';
import {isNil} from 'lodash/fp';
import queryString from 'query-string';
import './ERACommons.css';
import {AuthenticateNIH} from 'src/libs/ajax/AuthenticateNIH.js';
import {User} from 'src/libs/ajax/User.js';
import {Config} from 'src/libs/config.js';
import '../Animations.css';
import {Storage} from 'src/libs/storage.js';
import {
  decodeNihToken,
  extractEraAuthenticationState,
  rasEnabled,
  nihAccountLabel
} from '../../utils/ERACommonsUtils.js';
import ReactTooltip from 'react-tooltip';

export default function ERACommons(props) {

  const {
    onNihStatusUpdate,
    header = false,
    required = false,
    destination = '',
    researcherProfile = undefined,
  } = props;
  const [search, setSearch] = useState(props.location?.search || '');
  const [isAuthorized, setAuthorized] = useState(false);
  const [expirationCount, setExpirationCount] = useState(0);
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [nihError, setNihError] = useState(undefined);
  const accountLabel = nihAccountLabel();
  const currentUser = Storage.getCurrentUser();

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
          displayError('The system received an invalid token, please try again or submit an error report using the "Contact Us" form.');
          return;
        }
        // Rewrite the payload to match the expected format in Consent, so we can save the values on the back end.
        const nihPayload = {
          'linkedNihUsername': `${decodedToken.eraCommonsUsername}`,
          'linkExpireTime': `${decodedToken.exp}`,
          'status': true
        };
        const newUserProps = await AuthenticateNIH.saveNihUsr(nihPayload);
        const eraAuthState = extractEraAuthenticationState({
          properties: newUserProps,
          eraCommonsId: decodedToken.eraCommonsUsername
        });
        setAuthorized(eraAuthState.isAuthorized);
        setExpirationCount(eraAuthState.expirationCount);
        setEraCommonsId(eraAuthState.eraCommonsId);
        onNihStatusUpdate(eraAuthState.nihValid);
        document.getElementById('era-commons-id').scrollIntoView({
          block: 'start',
          inline: 'nearest',
          behavior: 'smooth'
        });
      }
    };
    initEraAuthSuccess();
  }, [onNihStatusUpdate, search]);

  /**
   * This will populate state from either the provided researcher object or the current user.
   */
  useEffect(() => {
    const initResearcherProfile = async () => {
      // In the case we are provided a researcherProfile object, we do not need to query for the current user.
      const user = (researcherProfile) ? researcherProfile : await User.getMe();
      const eraAuthState = extractEraAuthenticationState(user);
      setAuthorized(eraAuthState.isAuthorized);
      setExpirationCount(eraAuthState.expirationCount);
      setEraCommonsId(eraAuthState.eraCommonsId);
      onNihStatusUpdate(eraAuthState.nihValid);
    };
    initResearcherProfile();
  }, [researcherProfile, onNihStatusUpdate]);

  const redirectToNihLogin = async () => {
    const returnUrl = window.location.origin + '/' + destination + '?nih-username-token=<token>';
    window.location.href = `${await Config.getNihUrl()}?${queryString.stringify({'return-url': returnUrl})}`;
  };

  const redirectToECMAuthUrl = async () => {
    const origin = window.location.origin;
    const redirectTo = origin + '/' + destination;
    try {
      window.location.href = await AuthenticateNIH.getECMProviderAuthUrl(origin, redirectTo);
    } catch (error) {
      const errorMessage = 'Error from Authentication Provider: ' + error?.response?.data?.message + ': ' + currentUser.email;
      displayError(errorMessage);
    }
  };

  const deleteNihAccount = async () => {
    try {
      await AuthenticateNIH.deleteAccountLinkage();
      const response = await User.getMe();
      const eraAuthState = extractEraAuthenticationState(response.properties);
      setAuthorized(eraAuthState.isAuthorized);
      setExpirationCount(eraAuthState.expirationCount);
      setEraCommonsId(undefined);
      onNihStatusUpdate(eraAuthState.nihValid);
      setSearch('');
    } catch (_error) {
      const errorMessage = 'Something went wrong removing your account, please submit an error report using the "Contact Us" form.';
      displayError(errorMessage);
    }
  };

  const displayError = (message) => {
    setNihError(message);
    document.getElementById('era-commons-id').scrollIntoView({block: 'start', inline: 'nearest', behavior: 'smooth'});
  }

  const validationErrorState = get(props, 'validationError', false);

  return (
    <div id={'era-commons-id'} style={{minHeight: 65}}>
      {header && <label className="era-control-label">
        <span data-cy="era-commons-header">NIH {accountLabel} ID
          {required ? <span data-cy="era-commons-required">*</span> : ''}
        </span>
      </label>}
      {(!isAuthorized || expirationCount < 0) &&
        <a
          data-cy="era-commons-authenticate-link"
          className={validationErrorState ? 'era-button-state-error' : 'era-button-state'}
          onClick={rasEnabled() ? redirectToECMAuthUrl : redirectToNihLogin}
          target="_blank">
          <div className={rasEnabled() ? 'nih-logo-style' : 'era-logo-style'}/>
          <span style={{verticalAlign: '50%'}}>Authenticate your account</span>
        </a>
      }
      {nihError && <span data-cy="era-commons-error-span"
                         className="era-cancel-color era-required-field-error-span">{nihError}</span>}
      {isAuthorized && <div>
        {expirationCount >= 0 && <div className="era-commons-id-value">
          <span data-cy="era-commons-id-value">{eraCommonsId}</span>
            <button data-cy="era-delete-icon" className="era-delete-icon" type="button" onClick={deleteNihAccount}>
              <span className="glyphicon glyphicon-remove-circle" data-tip="Clear account"
                    data-for="tip_clear_era_commons_link"/>
            </button>
            <ReactTooltip
              place={'right'}
              effect={'solid'}
              id={`tip_clear_era_commons_link`}>Clear {accountLabel} Account Link</ReactTooltip>
        </div>}
        <div className="era-expiration-value">
          {expirationCount >= 0 && <div
            className="era-fadein">{`Your NIH authentication will expire in ${expirationCount} days`}</div>}
          {expirationCount < 0 &&
            <div className="era-fadein">{'Your NIH authentication has expired'}</div>}
        </div>
      </div>}
    </div>
  );
}
