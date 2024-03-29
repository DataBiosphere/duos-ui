/* eslint-disable no-undef */

import React from 'react';
import { mount } from 'cypress/react';
import DataCustodianTable from '../../../src/pages/signing_official_console/DataCustodianTable';

const dpaHeaderText = 'BROAD DATA USE OVERSIGHT SYSTEM (DUOS) - DATA PROVIDER AGREEMENT';

describe('DataCustodianTable - Tests', function () {
  it('Add New Data Submitter modal displays the DPA Text', function () {
    cy.viewport(600, 300);
    mount(<DataCustodianTable
      isLoading={false}
      signingOfficial={{institutionId: 1}}
      researchers={[]}
      unregisteredResearchers={[]}
    />);
    const button = cy.contains('ADD NEW DATA SUBMITTER', {matchCase: false});
    expect(button).to.exist;
    button.click();
    const dpaHeader = cy.contains(dpaHeaderText, {matchCase: false});
    expect(dpaHeader).to.exist;
  });

  it('Issue modal displays the DPA Text', function () {
    cy.viewport(600, 300);
    mount(<DataCustodianTable
      isLoading={false}
      signingOfficial={{institutionId: 1}}
      researchers={[
        {
          email: 'email',
          userId: 1,
          displayName: 'researcher',
          roles: [{name: 'Researcher'}],
        }
      ]}
      unregisteredResearchers={[]}
    />);
    const button = cy.get('button').last();
    expect(button).to.exist;
    button.click();
    const dpaHeader = cy.contains(dpaHeaderText);
    expect(dpaHeader).to.exist;
  });
});
