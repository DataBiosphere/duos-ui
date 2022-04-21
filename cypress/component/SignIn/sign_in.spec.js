/* eslint-disable no-undef */

import React from 'react';
import {mount} from '@cypress/react';
import SignIn from '../../../src/components/SignIn';
import { Config } from '../../../src/libs/config';

describe('Sign In Component', function() {
  it('Sign In Button Loads', function () {
    cy.viewport(600, 300);
    // Load the client id from perf so we can have a valid button
    cy.readFile('config/perf.json').then((config) => {
      const clientId = config.clientId;
      cy.stub(Config, 'getGoogleClientId').returns(clientId);
      mount(<SignIn />);
      cy.contains("Sign-in").should('exist');
    });
  });
  // Note that we do not want to click the signin button
  // in tests as that would trigger an auth-flow we cannot
  // replicate in a test environment.
});
