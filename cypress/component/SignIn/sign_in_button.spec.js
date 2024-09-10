/* eslint-disable no-undef */

import React from 'react';
import { mount } from 'cypress/react';
import SignInButton from '../../../src/components/SignInButton';

const signInText = 'Sign In';

// Note that we do not want to click the signin button
// in tests as that would trigger an auth-flow we cannot
// replicate in a test environment.
describe('Sign In Component', function() {
  it('Sign In Button Loads', function () {
    cy.viewport(600, 300);
    mount(<SignInButton history={undefined} onSignIn={() => {}}/>);
    cy.contains(signInText).should('exist');
  });
});
