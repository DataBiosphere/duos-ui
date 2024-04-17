import React, {useEffect, useState} from 'react';
import {get} from 'lodash';
import {isNil} from 'lodash/fp';
import queryString from 'query-string';
import './ERACommons.css';
import { AuthenticateNIH } from '../libs/ajax/AuthenticateNIH';
import { User } from '../libs/ajax/User';
import {Config} from '../libs/config';
import './Animations.css';
import {decodeNihToken, extractEraAuthenticationState} from '../../src/utils/ERACommonsUtils';
import ReactTooltip from 'react-tooltip';

export default function ERACommons(props) {

  const {onNihStatusUpdate, header = false, required = false, destination = '', researcherProfile = undefined, readOnly = false} = props;
  const [search, setSearch] = useState(props.location?.search || '');
  const [isAuthorized, setAuthorized] = useState(false);
  const [expirationCount, setExpirationCount] = useState(0);
  const [eraCommonsId, setEraCommonsId] = useState('');
  const [nihError, setNihError] = useState(false);

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
        const eraAuthState = extractEraAuthenticationState({properties: newUserProps, eraCommonsId: decodedToken.eraCommonsUsername});
        setAuthorized(eraAuthState.isAuthorized);
        setExpirationCount(eraAuthState.expirationCount);
        setEraCommonsId(eraAuthState.eraCommonsId);
        onNihStatusUpdate(eraAuthState.nihValid);
        document.getElementById('era-commons-id').scrollIntoView({block: 'start', inline: 'nearest', behavior: 'smooth'});
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
      onNihStatusUpdate(eraAuthState.nihValid);
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
      {header && <label className='era-control-label'>
        <span data-cy='era-commons-header'>NIH eRA Commons ID
          {required ? <span data-cy='era-commons-required'>*</span> : ''}
        </span>
      </label>}
      {(!isAuthorized || expirationCount < 0) && (!readOnly &&
          <a
            data-cy='era-commons-authenticate-link'
            className={validationErrorState ? 'era-button-state-error' : 'era-button-state'}
            onClick={redirectToNihLogin}
            target='_blank'>
            <div className={'era-logo-style'}/>
            <span style={{verticalAlign: '50%'}}>Authenticate your account</span>
          </a>
      )}
      {nihError && <span className='era-cancel-color era-required-field-error-span'>{nihErrorMessage}</span>}
      {isAuthorized && <div>
        {expirationCount >= 0 && <div className='era-commons-id-value'>
          <span data-cy='era-commons-id-value'>{eraCommonsId}</span>
          {!readOnly &&
              <button className='era-delete-icon' type='button' onClick={deleteNihAccount}>
                <span className='glyphicon glyphicon-remove-circle' data-tip='Clear account' data-for='tip_clear_era_commons_link' />
              </button>
          }
          {!readOnly &&
              <ReactTooltip
                place={'right'}
                effect={'solid'}
                id={`tip_clear_era_commons_link`}>Clear eRA Commons Account Link</ReactTooltip>
          }
        </div>}
        <div className='era-expiration-value'>
          {expirationCount >= 0 && <div className='era-fadein'>{`${readOnly ? 'This user\'s' : 'Your'} NIH authentication will expire in ${expirationCount} days`}</div>}
          {expirationCount < 0 && <div className='era-fadein'>{`${readOnly ? 'This user\'s' : 'Your'} NIH authentication has expired`}</div>}
        </div>
      </div>}
    </div>
  );
}
