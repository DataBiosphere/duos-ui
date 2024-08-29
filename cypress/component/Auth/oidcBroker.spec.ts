/* eslint-disable no-undef */

import {Config} from '../../../src/libs/config';
import {GoogleIS} from '../../../src/libs/googleIS';
import {OidcBroker} from '../../../src/libs/auth/oidcBroker';

describe('OidcBroker', function () {
  it('Sign Out calls Oidc UserManager sign-out functions', async function () {
    cy.stub(Config, 'getConfig').returns('{}');
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
