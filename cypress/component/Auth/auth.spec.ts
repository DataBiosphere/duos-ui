/* eslint-disable no-undef */

import {OidcBroker} from '../../../src/libs/auth/oidcBroker';
import {Auth} from '../../../src/libs/auth/auth';
import {OAuth2} from '../../../src/libs/ajax/OAuth2';
import {Storage} from '../../../src/libs/storage';
import {v4 as uuid} from 'uuid';
import {oidcUser} from './oidcUser';

describe('Auth Failure', function () {
  it('Sign In error throws expected message', async function () {
    cy.stub(OidcBroker, 'signIn').returns(null);
    cy.on('fail', (err) => {
      return err.message !== Auth.signInError();
    });
    Auth.signIn();
    expect(Storage.getOidcUser()).to.be.null;
    expect(Storage.userIsLogged()).to.be.false;
  });
});

describe('Auth Success', function () {
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
    Auth.initialize();
  });

  it('Sign In stores the current user', async function () {
    cy.stub(OidcBroker, 'signIn').returns(oidcUser);
    await Auth.signIn();
    expect(Storage.getOidcUser()).to.not.be.empty;
    expect(Storage.userIsLogged()).to.be.true;
  });

  it('Sign Out Clears the session when called', async function () {
    Storage.setUserIsLogged(true);
    Storage.setAnonymousId(uuid());
    Storage.setData('key', 'val');
    Storage.setEnv('test');
    expect(Storage.userIsLogged()).to.be.true;
    expect(Storage.getAnonymousId()).to.not.be.empty;
    expect(Storage.getData('key')).to.not.be.empty;
    expect(Storage.getEnv()).to.not.be.empty;
    await Auth.signOut();
    expect(Storage.userIsLogged()).to.be.false;
    expect(Storage.getAnonymousId()).to.be.null;
    expect(Storage.getData('key')).to.be.null;
    expect(Storage.getEnv()).to.be.null;
  });

});
