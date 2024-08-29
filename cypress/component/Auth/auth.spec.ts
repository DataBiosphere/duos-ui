/* eslint-disable no-undef */

import {Auth} from '../../../src/libs/auth/auth';
import {Config} from '../../../src/libs/config';
import {GoogleIS} from '../../../src/libs/googleIS';
import {OAuth2} from '../../../src/libs/ajax/OAuth2';
import {Storage} from '../../../src/libs/storage';

describe('Auth', function () {
  // Intercept configuration calls
  beforeEach(() => {
    cy.intercept({
      method: 'GET',
      url: '/config.json',
      hostname: 'localhost',
    }, {'env': 'local'});
    cy.stub(OAuth2, 'getConfig').returns({
      'authorityEndpoint': 'authorityEndpoint',
      'clientId': 'clientId'
    });
  });
  it('Sign Out Clears the session when called', async function () {
    cy.stub(Config, 'getGoogleClientId').returns('12345');
    cy.stub(GoogleIS, 'revokeAccessToken');
    await Auth.initialize();
    Storage.setUserIsLogged(true);
    expect(Storage.userIsLogged()).to.be.true;
    await Auth.signOut();
    expect(Storage.userIsLogged()).to.be.false;
  });
});
