/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import {DAA} from '../../../src/libs/ajax/DAA';
import {DAC} from '../../../src/libs/ajax/DAC';
import {Storage} from '../../../src/libs/storage';
import EditDac from '../../../src/pages/manage_dac/EditDac';
import {BrowserRouter} from 'react-router-dom';
import admin from './admin.json';
import chair from './chair.json';
import dac from './dac.json';

// It's necessary to wrap components that contain `Link` components
const WrappedEditDac = (props) => {
  return <BrowserRouter><EditDac {...props}/></BrowserRouter>;
};

describe('EditDAC Tests', () => {

  Cypress._.each([admin, chair], (user) => {
    it('Edit DAC page should load for ' + user.displayName, () => {
      cy.viewport(600, 800);
      cy.stub(Storage, 'getCurrentUser').returns(user);
      cy.stub(DAC, 'get').returns(dac);
      cy.stub(DAA, 'getDaas').returns([]);
      const props = {match: {params: {dacId: dac.dacId}}};
      mount(WrappedEditDac(props));
      cy.contains(dac.name).should('exist');
      cy.get('[data-cy="dac_name"]').should('not.be.disabled');
      cy.get('[data-cy="dac_description"]').should('not.be.disabled');
      cy.get('[data-cy="dac_email"]').should('not.be.disabled');
      cy.get('[data-cy="btn_save"]').should('not.be.disabled');
      cy.get('[data-cy="btn_cancel"]').should('not.be.disabled');
      cy.get('[data-cy="daa_radio"]').should('not.be.disabled');
      cy.get('[data-cy="daa_upload_button"]').should('not.be.disabled');
    });
  });

});
