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
});