/* eslint-disable no-undef */

import React from 'react';
import { mount } from 'cypress/react18';
import SignInButton from '../../../src/components/SignInButton';
import {User} from '../../../src/libs/ajax/User';
import {Auth} from '../../../src/libs/auth/auth';
import {Storage} from '../../../src/libs/storage';
import {Metrics} from '../../../src/libs/ajax/Metrics';
import {StackdriverReporter} from '../../../src/libs/stackdriverReporter';
import {ToS} from '../../../src/libs/ajax/ToS';

const signInText = 'Sign In';

const claims = {
  jti: undefined, nbf: undefined, sub: undefined,
  iss: '',
  aud: '',
  exp: 0,
  iat: 0
};

const user = {
  access_token: '', get expires_in() {
    return undefined;
  }, session_state: undefined, state: undefined, token_type: '', get expired() {
    return undefined;
  }, get scopes() {
    return [];
  }, toStorageString() {
    return '';
  },
  profile: claims
};

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
  roles: [{
    name : 'Admin'
  }]
};

const userStatus = {
  'adminEnabled': true,
  'enabled': true,
  'inAllUsersGroup': true,
  'inGoogleProxyGroup': true,
  'tosAccepted': true
};

describe('Sign In: Component Loads', function() {

  it('Sign In Button Loads', function () {
    cy.viewport(600, 300);
    mount(<SignInButton history={undefined} />);
    cy.contains(signInText).should('exist');
  });

  it('Sign In: On Success', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').returns(Promise.resolve(user));
    cy.stub(User, 'getMe').returns(duosUser);
    cy.stub(StackdriverReporter, 'report');
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    cy.stub(ToS, 'getStatus').returns(userStatus);
    mount(<SignInButton history={[]} />);
    cy.get('button').click().then(() => {
      expect(Storage.getCurrentUser()).to.deep.equal(duosUser);
      expect(Storage.getAnonymousId()).to.not.be.null;
      expect(StackdriverReporter.report).to.not.be.called;
      expect(Metrics.identify).to.be.called;
      expect(Metrics.syncProfile).to.be.called;
      expect(Metrics.captureEvent).to.be.called;
    });
  });

  it('Sign In: No Roles Error Reporter Is Called', function () {
    const bareUser = {email: 'test@user.com'};
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').returns(Promise.resolve(user));
    cy.stub(User, 'getMe').returns(bareUser);
    cy.stub(StackdriverReporter, 'report');
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    cy.stub(ToS, 'getStatus').returns(userStatus);
    mount(<SignInButton history={[]} />);
    cy.get('button').click().then(() => {
      expect(StackdriverReporter.report).to.be.called;
    });
  });

});
