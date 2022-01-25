/* eslint-disable no-undef */

import React from 'react';
import {mount} from '@cypress/react';
import SigningOfficialTable
  from '../../../src/components/signing_official_table/SigningOfficialTable';

describe('SigningOfficialTable - Tests', function() {
  it('SigningOfficialTable - Add New Researcher modal displays the LCA Text', function() {
    cy.viewport(600, 300);
    mount(<SigningOfficialTable
      isLoading={false}
      signingOfficial={{institutionId: 1}}
      researchers={[]}
      unregisteredResearchers={[]}
    />);
    const button = cy.contains('Add New Researcher');
    expect(button).to.exist;
    button.click();
    const lcaHeader = cy.contains(
      'Broad Data Use Oversight System (DUOS) – LIBRARY CARD AGREEMENT');
    expect(lcaHeader).to.exist;
  });
});
