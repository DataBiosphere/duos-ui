import React from 'react';
import {Config} from './config';
import axios from 'axios';
import {getApiUrl} from './ajax';

/**
 * This utility is a wrapper around Google's Identity Services API
 * https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#gis-only
 * For the purposes of DUOS authentication, our primary need is for an
 * Access Token that we can use to communicate with any back end system.
 */

const SCOPES = ['openid',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'].join(' ');

export const GoogleIS = {

  client: null,

  accessToken: null,

  authenticated: false,

  userInfo: {},

  initTokenClient: async (onSuccess, onFailure) => {
    const clientId = await Config.getGoogleClientId();
    const google = window.google;
    GoogleIS.client = await google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse) => {
        try {
          GoogleIS.accessToken = tokenResponse.access_token;
          GoogleIS.authenticated = true;
          const userInfo = GoogleIS.getUserInfo(tokenResponse.access_token);
          GoogleIS.userInfo = Object.assign({accessToken: GoogleIS.accessToken}, userInfo);
          onSuccess(GoogleIS.userInfo);
        } catch (e) {
          onFailure(e);
        }
      },
    });
  },

  requestAccessToken: async (onSuccess, onFailure) => {
    try {
      if (GoogleIS.client === null) {
        await GoogleIS.initTokenClient(onSuccess, onFailure);
      }
      GoogleIS.accessToken = await GoogleIS.client.requestAccessToken();
    } catch (e) {
      onFailure(e);
    }
  },

  getUserInfo: async (token) => {
    // const url = 'https://www.googleapis.com/oauth2/v3/userinfo';
    const url = `${await getApiUrl()}/api/user/me`;
    const response = await axios.get(url, Config.authOpts(token));
    return response.data;
  },

  revokeAccessToken: async () => {
    if (GoogleIS.accessToken !== null) {
      if (GoogleIS.client === null) {
        await GoogleIS.initTokenClient(() => {}, () => {});
      }
      await window.google.accounts.oauth2.revoke(GoogleIS.accessToken, () => {
      });
    }
  },

  signInButton: (onSuccess, onFailure) => <button
    type='button'
    style={{
      backgroundColor: 'rgb(66, 133, 244)',
      display: 'inline-flex',
      alignItems: 'center',
      color: 'rgb(255, 255, 255)',
      boxShadow: 'rgba(0, 0, 0, 0.24) 0px 2px 2px 0px, rgba(0, 0, 0, 0.24) 0px 0px 1px 0px',
      padding: '0px',
      borderRadius: '2px',
      border: '1px solid transparent',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'Roboto, sans-serif'
    }}
    onClick={() => {
      GoogleIS.requestAccessToken(onSuccess, onFailure);
    }}>
    <div style={{marginRight: '10px', background: 'rgb(255, 255, 255)', padding: '10px', borderRadius: '2px'}}>
      <svg width='18' height='18' xmlns='http://www.w3.org/2000/svg'>
        <g fill='#000' fillRule='evenodd'>
          <path
            d='M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z'
            fill='#EA4335'></path>
          <path
            d='M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z'
            fill='#4285F4'></path>
          <path
            d='M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z'
            fill='#FBBC05'></path>
          <path
            d='M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z'
            fill='#34A853'></path>
          <path fill='none' d='M0 0h18v18H0z'></path>
        </g>
      </svg>
    </div>
    <span style={{padding: '10px 10px 10px 0px', fontWeight: '500'}}>
        Sign-in/Register
    </span>
  </button>
};
