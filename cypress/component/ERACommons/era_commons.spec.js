/* eslint-disable no-undef */

import ERACommons from '../../../src/components/ERACommons.jsx';
import {decodeNihToken} from '../../../src/utils/ERACommonsUtils';
import { AuthenticateNIH } from '../../../src/libs/ajax/AuthenticateNIH';
import { User } from '../../../src/libs/ajax/User';
import {mount} from 'cypress/react';
import React from 'react';
import {Buffer} from 'buffer';

// Example token from https://broad-shibboleth-prod.appspot.com/dev/login?return-url=%2Fexample-return%3Ftoken%3D%3Ctoken%3E
const encodedToken =
`eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ
lcmFDb21tb25zVXNlcm5hbWUiOiJ0ZXN0aW5nIiw
iaWF0IjoxNzA5NTYxMjc2LCJleHAiOjE3MDk1NjQ
4NzZ9.HKnqebvJVL63jKZDqheYWRSNaLvB92b0Dk
CQl_ZSbZ1EIOgEI0nz3VeX3usC9AbNHvdYbyZbEX
4kqGo5NwjstP0FXRpl8UTamLtC6XlmzyAp6Kdr_5
HfB6pK5T80dDNOX7Z0LHvZvbdeDOltq-RY00ZMY_
RaNiiP6NoJusI_IRRl12CdLJSg6aBCZ9iiIQAzEq
0gS8Fph06AyWzdol7XgBU7luOZ8jd8NyJG3r2xtH
KNCf8PHBSwiotFxBCcDM-eAakIobz-XjJ7uAYM_Z
M-C5Sq4vsz3jwhUWBmf8_J55bFAhM_n-AooxphpO
bEc9G_sDJjolIqSjt_UwgT1JFPFA`;

const researcher = {
  'id': 1,
  'firstName': 'Test',
  'lastName': 'User',
  'email': 'test@email.com'
};

const buildToken = (username, iat, exp) => {
  const part1 = `{"alg":"RS256","typ":"JWT"}`;
  const part2 = {
    eraCommonsUsername: username,
    iat: iat,
    exp: exp
  };
  const part3 = '...';
  return Buffer.from(`${part1}${JSON.stringify(part2)}${part3}`).toString('base64');
};

describe('ERA Commons Utility', function () {
  it('decodeNihToken works with a valid base64 encoded token', async function () {
    const token = {'nih-username-token': encodedToken};
    const decoded = await decodeNihToken(token);
    expect(decoded).to.not.equal(null);
    expect(decoded.eraCommonsUsername).to.equal('testing');
    expect(decoded.iat).to.equal(1709561276);
    expect(decoded.exp).to.equal(1709564876);
  });
  it('decodeNihToken returns null if the token is invalid', async function () {
    const token = {'nih-username-token': 'invalid'};
    const decoded = await decodeNihToken(token);
    expect(decoded).to.equal(null);
  });
});

describe('ERA Commons Component', function () {
  it('renders an empty ERA Commons component with header and required', function () {
    cy.stub(User, 'getMe').returns(researcher);
    mount(<ERACommons
      isAuthorized={false}
      className={''}
      destination={''}
      header={true} // Triggers the NIH eRA Commons header
      onNihStatusUpdate={() => {}}
      readOnly={false}
      required={true} // Triggers the required flag on the NIH eRA Commons ID
      style={{}}
    />);
    cy.get('#era-commons-id').should('exist');
    cy.get('[data-cy=era-commons-header').should('exist');
    cy.get('[data-cy=era-commons-required').should('exist');
    cy.get('[data-cy=era-commons-authenticate-link').should('exist');
    cy.get('.required-field-error-span').should('not.exist');
  });

  it('renders a populated ERA Commons component after having authenticated with NIH', function () {
    const clonedResearcher = JSON.parse(JSON.stringify(researcher));
    clonedResearcher.eraCommonsId = 'testing';
    const iat = new Date().getTime();
    const exp = iat + (30 * 24 * 60 * 60 * 1000); // iat + 30 days
    clonedResearcher.properties = [
      {propertyKey:'eraAuthorized', propertyValue: true},
      {propertyKey:'eraExpiration', propertyValue: exp}
    ];
    cy.stub(User, 'getMe').returns(clonedResearcher);
    // The saveNihUsr function only returns the user's properties, not the entire user object
    cy.stub(AuthenticateNIH, 'saveNihUsr').returns(clonedResearcher.properties);
    mount(<ERACommons
      isAuthorized={true}
      className={''}
      destination={''}
      location={{search: `?nih-username-token=${buildToken('testing', iat, exp)}`}}
      header={true}
      onNihStatusUpdate={() => {}}
      readOnly={false}
      required={true}
      style={{}}
    />);
    cy.get('#era-commons-id').should('exist');
    cy.get('[data-cy=era-commons-header').should('exist');
    cy.get('[data-cy=era-commons-required').should('exist');
    cy.get('[data-cy=era-commons-authenticate-link').should('not.exist');
    cy.get('[data-cy=era-commons-id-value').should('exist');
    cy.get('.required-field-error-span').should('not.exist');
  });
});