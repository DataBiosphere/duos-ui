/* eslint-disable no-undef */

import {Auth} from '../../../src/libs/auth/auth';
import {Config} from '../../../src/libs/config';
import {GoogleIS} from '../../../src/libs/googleIS';
import {Storage} from '../../../src/libs/storage';

describe('Auth', function () {
  it('Sign Out Clears the session when called', async function () {
    cy.stub(Config, 'getConfig').returns('{}');
    cy.stub(Config, 'getGoogleClientId').returns('12345');
    cy.stub(GoogleIS, 'revokeAccessToken');
    await Auth.initialize();
    Storage.setUserIsLogged(true);
    expect(Storage.userIsLogged()).to.be.true;
    await Auth.signOut();
    expect(Storage.userIsLogged()).to.be.false;
  });
});
