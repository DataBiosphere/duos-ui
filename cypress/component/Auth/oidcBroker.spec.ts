import { OAuth2 } from 'src/libs/ajax/OAuth2';
import { OidcBroker } from 'src/libs/auth/oidcBroker';

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
    cy.initApplicationConfig();
    cy.stub(OAuth2, 'getConfig').returns({
      'authorityEndpoint': Cypress.config().baseUrl,
      'clientId': 'clientId'
    });
  });

  it('Initialization Succeeds', function () {
    cy.wrap(OidcBroker.initialize()).then(() => {
      cy.wrap(OidcBroker.getUserManager()).should('not.be.null');
      cy.wrap(OidcBroker.getUserManagerSettings()).should('not.be.null');
    });
  });

  it('Sign In calls Oidc Broker UserManager sign-in popup function', function () {
    cy.wrap(OidcBroker.initialize()).then(() => {
      const um = OidcBroker.getUserManager();
      cy.spy(um, 'signinPopup').as('signinPopup');
      // Since we are not calling a real sign-in url, we expect oidc-client errors when doing so
      cy.on('uncaught:exception', (err) => {
        return !(err.message.includes('Invalid URL'))
      });
      OidcBroker.signIn();
      cy.get('@signinPopup').should('have.been.called');
    });
  });

  it('Sign Out calls Oidc UserManager sign-out functions', function () {
    cy.wrap(OidcBroker.initialize()).then(() => {
      const um = OidcBroker.getUserManager();
      cy.spy(um, 'removeUser').as('removeUser');
      cy.spy(um, 'clearStaleState').as('clearStaleState');
      cy.wrap(OidcBroker.signOut()).then(() => {
        cy.get('@removeUser').should('have.been.called');
        cy.get('@clearStaleState').should('have.been.called');
      });
    });
  });

});
