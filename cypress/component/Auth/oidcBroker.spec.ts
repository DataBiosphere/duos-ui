/* eslint-disable no-undef */

import {Config} from '../../../src/libs/config';
import {GoogleIS} from '../../../src/libs/googleIS';
import {OAuth2} from '../../../src/libs/ajax/OAuth2';
import {OidcBroker} from '../../../src/libs/auth/oidcBroker';

describe('OidcBroker', function () {
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
  it('Sign Out calls Oidc UserManager sign-out functions', async function () {
    cy.stub(Config, 'getGoogleClientId').returns('12345');
    cy.stub(GoogleIS, 'revokeAccessToken');
    await OidcBroker.initialize();
    const um = OidcBroker.getUserManager();
    cy.spy(um, 'removeUser').as('removeUser');
    cy.spy(um, 'clearStaleState').as('clearStaleState');
    await OidcBroker.signOut();
    expect(um.removeUser).to.be.called;
    expect(um.clearStaleState).to.be.called;
  });
});
