/* eslint-disable no-undef */

import React from 'react';
import { mount } from 'cypress/react';
import DACDatasets from '../../../src/pages/DACDatasets';

describe('Dac Dataset Table Component', function() {
  it('Dac Dataset Table Page Loads', function () {
    cy.viewport(600, 300);
    mount(<DACDatasets />);
    cy.contains("My DAC's Datasets").should('exist');
  });
});