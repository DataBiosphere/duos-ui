import { OidcBroker } from 'src/libs/auth/oidcBroker';
import { Auth } from 'src/libs/auth/auth';
import { OAuth2 } from 'src/libs/ajax/OAuth2';
import { Storage } from 'src/libs/storage';
import { v4 as uuid } from 'uuid';
import { mockOidcUser } from './mockOidcUser';

describe('Auth Failure', function () {
  it('Sign In error throws expected message', function () {
    cy.stub(OidcBroker, 'signIn').returns(null);
    cy.on('fail', (err) => {
      return err.message !== Auth.signInError();
    });
    Auth.signIn().then(() => {
      cy.wrap(Storage.getOidcUser()).should('be.null');
      cy.wrap(Storage.userIsLogged()).should('be.false');
    });
  });
});

describe('Auth Success', function () {
  // Intercept configuration calls
  beforeEach(() => {
    cy.initApplicationConfig();
    cy.stub(OAuth2, 'getConfig').returns({
      'authorityEndpoint': Cypress.config().baseUrl,
      'clientId': 'clientId'
    });
    Auth.initialize();
  });

  it('Sign In stores the current user', function () {
    cy.stub(OidcBroker, 'signIn').returns(mockOidcUser);
    Auth.signIn().then(() => {
      cy.wrap(Storage.getOidcUser()).should('not.be.empty');
      cy.wrap(Storage.userIsLogged()).should('be.true');
    });
  });

  it('Sign Out Clears the session when called', function () {
    Storage.setUserIsLogged(true);
    Storage.setAnonymousId(uuid());
    Storage.setData('key', 'val');
    Storage.setEnv('test');
    cy.wrap(Storage.userIsLogged()).should('be.true');
    cy.wrap(Storage.getAnonymousId()).should('not.be.empty');
    cy.wrap(Storage.getData('key')).should('not.be.empty');
    cy.wrap(Storage.getEnv()).should('not.be.empty');
    Auth.signOut().then(() => {
      cy.wrap(Storage.userIsLogged()).should('be.false');
      cy.wrap(Storage.getAnonymousId()).should('be.null');
      cy.wrap(Storage.getData('key')).should('be.null');
      cy.wrap(Storage.getEnv()).should('be.null');
    });
  });

});
