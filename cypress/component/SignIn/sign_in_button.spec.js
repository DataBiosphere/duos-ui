/* eslint-disable no-undef */

import React from 'react';
import { mount } from 'cypress/react';
import SignInButton from '../../../src/components/SignInButton';
import { Config } from '../../../src/libs/config';

const signInText = 'Sign in';

// Note that we do not want to click the signin button
// in tests as that would trigger an auth-flow we cannot
// replicate in a test environment.
describe('Sign In Button', () => {
  describe('when clicked', () => {
    it('should show a spinner while resolving', () => {

    });
    it('should show an error if signing in fails', () => {

    });
    it('should display sign in text if sign in is cancelled', () => {

    });

  });
});