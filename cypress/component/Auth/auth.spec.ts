/* eslint-disable no-undef */

import {Auth} from '../../../src/libs/auth/auth';
import {Config} from '../../../src/libs/config';
import {GoogleIS} from '../../../src/libs/googleIS';
import {OAuth2} from '../../../src/libs/ajax/OAuth2';
import {Storage} from '../../../src/libs/storage';
import { v4 as uuid } from 'uuid';

describe('Auth', function () {
  // Intercept configuration calls
  beforeEach(async () => {
    cy.intercept({
      method: 'GET',
      url: '/config.json',
      hostname: 'localhost',
    }, {'env': 'ci'});
    cy.stub(OAuth2, 'getConfig').returns({
      'authorityEndpoint': 'authorityEndpoint',
      'clientId': 'clientId'
    });
    await Auth.initialize();
  });
  it('Sign Out Clears the session when called', async function () {
    cy.stub(Config, 'getGoogleClientId').returns('12345');
    cy.stub(GoogleIS, 'revokeAccessToken');
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
