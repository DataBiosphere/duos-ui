/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import {Auth} from '../../../src/libs/auth/auth';
import TermsOfServiceAcceptance from '../../../src/pages/TermsOfServiceAcceptance';
import {Navigation} from '../../../src/libs/utils';
import {OAuth2} from '../../../src/libs/ajax/OAuth2';
import {ToS} from '../../../src/libs/ajax/ToS';
import {Storage} from '../../../src/libs/storage';

const text = 'TOS Text';
const mocks = {
  history: {
    push() {
    }
  }
};

describe('Terms of Service Acceptance Page', function () {
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
  it('Standard text loads correctly and buttons work', function () {
    cy.viewport(600, 300);
    cy.stub(ToS, 'getDUOSText').returns(text);
    cy.stub(ToS, 'acceptToS').returns(true);
    cy.stub(Storage, 'getCurrentUser').returns({});
    cy.stub(Navigation, 'back').returns(true);
    const setUserIsLoggedSpy = cy.spy(Storage, 'setUserIsLogged');
    const clearStorageSpy = cy.spy(Storage, 'clearStorage');

    mount(<TermsOfServiceAcceptance
      history={mocks.history}
    />);

    // Test that the reject button clicks and calls sign-out
    cy.contains(text).should('exist');
    const rejectButton = cy.contains('reject', {matchCase: false});
    expect(rejectButton).to.exist;
    rejectButton.click().then(() => {
      expect(setUserIsLoggedSpy).to.be.called;
      expect(clearStorageSpy).to.be.called;
    });

    // Test that the accept button clicks and calls accept ToS
    const acceptButton = cy.contains('accept', {matchCase: false});
    expect(acceptButton).to.exist;
    acceptButton.click().then(() =>
      expect(ToS.acceptToS).to.be.called
    );

  });
});
