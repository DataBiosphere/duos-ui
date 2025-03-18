import React from 'react';
import {mount} from 'cypress/react';
import SignInButton from '../../../src/components/SignInButton';
import {User} from '../../../src/libs/ajax/User';
import {Auth} from '../../../src/libs/auth/auth';
import {Storage} from '../../../src/libs/storage';
import {Metrics} from '../../../src/libs/ajax/Metrics';
import {StackdriverReporter} from '../../../src/libs/stackdriverReporter';
import {ToS} from '../../../src/libs/ajax/ToS';
import {ServiceStatus} from '../../../src/libs/ajax/ServiceStatus';
import {mockOidcUser} from '../Auth/mockOidcUser';
const signInText = 'Sign In';

const duosUser = {
  displayName: 'display name',
  email: 'test@user.com',
  isAdmin: true,
  isAlumni: false,
  isChairPerson: false,
  isDataSubmitter: false,
  isMember: false,
  isResearcher: false,
  isSigningOfficial: false,
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

const consentStatus = {
  systems: {
    sam: {
      details: {
        ok: true
      }
    }
  }
};

const notAcceptedUserStatus = Object.assign({}, userStatus, {'tosAccepted': false});

describe('Sign In: Component Loads', function () {

  beforeEach(() => {
    cy.initApplicationConfig();
    cy.stub(ServiceStatus, 'getConsentStatus').resolves(consentStatus);
  });

  it('Sign In Button Loads', function () {
    cy.viewport(600, 300);
    mount(<SignInButton history={undefined}/>);
    cy.contains(signInText).should('exist');
    cy.get('button').should('exist').and('not.be.disabled');
  });

  it('Sign In: On Success', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').resolves(mockOidcUser);
    cy.intercept({method: 'GET', url: '**/api/user/me'}, {statusCode: 200, body: duosUser}).as('getMe');
    cy.stub(StackdriverReporter, 'report');
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    cy.stub(ToS, 'getStatus').returns(userStatus);
    mount(<SignInButton history={[]}/>);
    cy.get('button').click();
    cy.wait('@getMe').then(() => {
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
    cy.stub(Auth, 'signIn').resolves(mockOidcUser);
    cy.intercept({method: 'GET', url: '**/api/user/me'}, {statusCode: 200, body: bareUser}).as('getMe');
    cy.stub(StackdriverReporter, 'report');
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    cy.stub(ToS, 'getStatus').returns(userStatus);
    mount(<SignInButton history={[]}/>);
    cy.get('button').click();
    cy.wait('@getMe').then(() => {
      expect(StackdriverReporter.report).to.be.called;
    });
  });

  it('Sign In: Redirects to ToS if not accepted', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').resolves(mockOidcUser);
    cy.intercept({method: 'GET', url: '**/api/user/me'}, {statusCode: 200, body: duosUser}).as('getMe');
    cy.stub(ToS, 'getStatus').returns(notAcceptedUserStatus);
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    const history = [];
    mount(<SignInButton history={history}/>);
    cy.get('button').click();
    cy.wait('@getMe').then(() => {
      expect(history).to.not.be.empty;
      expect(history[0].includes('tos_acceptance')).to.be.true;
    });
  });

  it('Sign In: Registers user if not found and redirects to ToS', function () {
    cy.viewport(600, 300);
    cy.stub(Auth, 'signIn').resolves(mockOidcUser);
    // Simulate user not found
    cy.stub(User, 'getMe').throws();
    cy.intercept({method: 'POST', url: '**/api/user'}, {statusCode: 200, body: duosUser}).as('registerUser');
    cy.stub(ToS, 'getStatus').returns(notAcceptedUserStatus);
    cy.stub(Metrics, 'identify');
    cy.stub(Metrics, 'syncProfile');
    cy.stub(Metrics, 'captureEvent');
    const history = [];
    mount(<SignInButton history={history}/>);
    cy.get('button').click();
    cy.wait('@registerUser').then(() => {
      expect(history).to.not.be.empty;
      expect(history[0].includes('tos_acceptance')).to.be.true;
    });
  });

  it('Sign In: Button is disabled when SAM is unhealthy', function () {
    cy.viewport(600, 300);
    cy.stub(ServiceStatus, 'isSamHealthy').resolves(false);
    mount(<SignInButton history={[]}/>);
    cy.get('button').should('exist').and('be.disabled');
  });
});
