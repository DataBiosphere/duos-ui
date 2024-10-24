/* eslint-disable no-undef */

import {OAuth2} from '../../../src/libs/ajax/OAuth2';
import {OidcBroker} from '../../../src/libs/auth/oidcBroker';

describe('OidcBroker Failure', function () {

  it('Get User Manager Fails without initialization',  function () {
    cy.on('fail', (err) => {
      return !err.message.includes('initialized');
    });
    OidcBroker.getUserManager();
  });

  it('Get User Manager Settings Fails without initialization',  function () {
    cy.on('fail', (err) => {
      return !err.message.includes('initialized');
    });
    OidcBroker.getUserManagerSettings();
  });

});

describe('OidcBroker Success', function () {
  // Intercept configuration calls
  beforeEach(() => {
    cy.intercept({
      method: 'GET',
      url: '/config.json',
      hostname: 'localhost',
    }, {'env': 'ci'});
    cy.stub(OAuth2, 'getConfig').returns({
      'authorityEndpoint': Cypress.config().baseUrl,
      'clientId': 'clientId'
    });
  });

  it('Initialization Succeeds', async function () {
    await OidcBroker.initialize();
    expect(OidcBroker.getUserManager()).to.not.be.null;
    expect(OidcBroker.getUserManagerSettings()).to.not.be.null;
  });

  it('Sign In calls Oidc Broker UserManager sign-in popup function', async function () {
    await OidcBroker.initialize();
    const um = OidcBroker.getUserManager();
    cy.spy(um, 'signinPopup').as('signinPopup');
    // Since we are not calling a real sign-in url, we expect oidc-client errors when doing so
    cy.on('uncaught:exception', (err) => {
      return !(err.message.includes('Invalid URL'))
    });
    OidcBroker.signIn();
    expect(um.signinPopup).to.be.called;
  });

  it('Sign Out calls Oidc UserManager sign-out functions', async function () {
    await OidcBroker.initialize();
    const um = OidcBroker.getUserManager();
    cy.spy(um, 'removeUser').as('removeUser');
    cy.spy(um, 'clearStaleState').as('clearStaleState');
    await OidcBroker.signOut();
    expect(um.removeUser).to.be.called;
    expect(um.clearStaleState).to.be.called;
  });

});
