/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react18';
import SignInButton from '../../../src/components/SignInButton';
import {User} from '../../../src/libs/ajax/User';
import {Auth} from '../../../src/libs/auth/auth';
import {Storage} from '../../../src/libs/storage';
import {Metrics} from '../../../src/libs/ajax/Metrics';
import {StackdriverReporter} from '../../../src/libs/stackdriverReporter';
import {ToS} from '../../../src/libs/ajax/ToS';
import {mockOidcUser} from '../Auth/mockOidcUser';

const signInText = 'Sign In';

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
  roles: [{
    name: 'Admin'
  }]
};

const userStatus = {
  'adminEnabled': true,
  'enabled': true,
  'inAllUsersGroup': true,
  'inGoogleProxyGroup': true,
  'tosAccepted': true
};

const notAcceptedUserStatus = Object.assign({}, userStatus, {'tosAccepted': false});

describe('Sign In: Component Loads', function () {

  it('Sign In Button Loads', function () {
    cy.viewport(600, 300);
    mount(<SignInButton history={undefined}/>);
    cy.contains(signInText).should('exist');
  });

  it('Sign In: On Success', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').returns(Promise.resolve(mockOidcUser));
    cy.stub(User, 'getMe').returns(duosUser);
    cy.stub(StackdriverReporter, 'report');
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    cy.stub(ToS, 'getStatus').returns(userStatus);
    mount(<SignInButton history={[]}/>);
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
    cy.stub(Auth, 'signIn').returns(Promise.resolve(mockOidcUser));
    cy.stub(User, 'getMe').returns(bareUser);
    cy.stub(StackdriverReporter, 'report');
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    cy.stub(ToS, 'getStatus').returns(userStatus);
    mount(<SignInButton history={[]}/>);
    cy.get('button').click().then(() => {
      expect(StackdriverReporter.report).to.be.called;
    });
  });

  it('Sign In: Redirects to ToS if not accepted', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').returns(Promise.resolve(mockOidcUser));
    cy.stub(User, 'getMe').returns(duosUser);
    cy.stub(ToS, 'getStatus').returns(notAcceptedUserStatus);
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    let history = [];
    mount(<SignInButton history={history}/>);
    cy.get('button').click().then(() => {
      expect(history).to.not.be.empty;
      expect(history[0].includes('tos_acceptance')).to.be.true;
    });
  });

  it('Sign In: Registers user if not found and redirects to ToS', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').returns(Promise.resolve(mockOidcUser));
    // Simulate user not found
    cy.stub(User, 'getMe').throws();
    cy.stub(User, 'registerUser').returns(duosUser);
    cy.stub(ToS, 'getStatus').returns(notAcceptedUserStatus);
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    let history = [];
    mount(<SignInButton history={history}/>);
    cy.get('button').click().then(() => {
      expect(User.registerUser).to.be.called;
      expect(history).to.not.be.empty;
      expect(history[0].includes('tos_acceptance')).to.be.true;
    });
  });

});
