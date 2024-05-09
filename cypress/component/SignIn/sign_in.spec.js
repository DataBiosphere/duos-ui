/* eslint-disable no-undef */

import React from 'react';
import { mount } from 'cypress/react';
import SignInButton from '../../../src/components/SignInButton';
import { Config } from '../../../src/libs/config';

const signInText = 'Sign In';

// Note that we do not want to click the signin button
// in tests as that would trigger an auth-flow we cannot
// replicate in a test environment.
describe('Sign In Component', function() {
  it('Sign In Button Loads when client id is valid', function () {
    cy.viewport(600, 300);
    // Load the client id from alpha so we can have a valid button
    cy.readFile('config/alpha.json').then((config) => {
      const clientId = config.clientId;
      cy.stub(Config, 'getGoogleClientId').returns(clientId);
      mount(<SignInButton />);
      cy.contains(signInText).should('exist');
    });
  });
});
