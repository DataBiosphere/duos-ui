/* eslint-disable no-undef */

import React from 'react';
import {mount} from '@cypress/react';
import SignIn from '../../../src/components/SignIn';
import { Config } from '../../../src/libs/config';

const signInText = "Sign-in";

// Note that we do not want to click the signin button
// in tests as that would trigger an auth-flow we cannot
// replicate in a test environment.
describe('Sign In Component', function() {
  it('Sign In Button Loads when client id is valid', function () {
    cy.viewport(600, 300);
    // Load the client id from perf so we can have a valid button
    cy.readFile('config/perf.json').then((config) => {
      const clientId = config.clientId;
      cy.stub(Config, 'getGoogleClientId').returns(clientId);
      mount(<SignIn />);
      cy.contains(signInText).should('exist');
    });
  });
  it('Spinner loads when client id is empty', function () {
    cy.viewport(600, 300);
    cy.stub(Config, 'getGoogleClientId').returns('');
    mount(<SignIn />);
    cy.contains(signInText).should('not.exist');
  });
});
