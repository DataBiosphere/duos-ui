/* eslint-disable no-undef */

import { mount } from 'cypress/react';
import React from 'react';
import DatasetFilterList from '../../../src/components/data_search/DatasetFilterList';

describe('Data Library Filters', () => {
  // Intercept configuration calls
  beforeEach(() => {
    cy.initApplicationConfig();
  });

  it('Renders the data library filters', () => {
    const props = { datasets: [], filterHandler: () => {}, isFiltered: () => {}};
    mount(<DatasetFilterList {...props} />);
    cy.get('div').should('contain', 'Filters');
    cy.get('div').should('contain', 'Access Type');
    cy.get('div').should('contain', 'Data Use');
    cy.get('div').should('contain', 'Data Access Committee');
    cy.get('div').should('contain', 'Data Type');
    cy.get('div').should('contain', 'Participant Count');
  });
});
