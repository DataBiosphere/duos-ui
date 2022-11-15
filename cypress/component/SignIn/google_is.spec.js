/* eslint-disable no-undef */

import {GoogleIS} from '../../../src/libs/googleIS';

describe('Google IS Utility', function () {
  it('GoogleIS.initTokenClient works with a valid client id', function () {
    cy.viewport(600, 300);
    cy.readFile('config/alpha.json').then((config) => {
      const clientId = config.clientId;
      GoogleIS.initTokenClient(
        clientId,
        () => {},
        () => {})
        .then(() => {
          expect(GoogleIS.client).to.not.equal(null);
        });
    });
  });

  it('GoogleIS.requestAccessToken: Cannot be tested as it would trigger an OAuth flow', function () {
    expect(true).to.equal(true);
  });

  it('GoogleIS.revokeAccessToken does not fail with empty client or access token', function () {
    cy.viewport(600, 300);
    cy.readFile('config/alpha.json').then((config) => {
      const clientId = config.clientId;
      GoogleIS.initTokenClient(
        clientId,
        () => {},
        () => {})
        .then(() => {
          expect(GoogleIS.client).to.not.equal(null);
          GoogleIS.revokeAccessToken(clientId).then(() => {
            expect(GoogleIS.client).to.equal(null);
            expect(GoogleIS.accessToken).to.equal(null);
          });
        });
    });
  });

  it('GoogleIS.signInButton renders a button', function() {
    cy.viewport(600, 300);
    const button = GoogleIS.signInButton('', () => {}, () => {});
    expect(button).to.not.equal(null);
    expect(button.type).to.equal('button');
  });
});
