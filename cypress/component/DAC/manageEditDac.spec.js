/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import {DAC} from '../../../src/libs/ajax/DAC';
import {Storage} from '../../../src/libs/storage';
import ManageEditDac from '../../../src/pages/manage_dac/ManageEditDac';
import {BrowserRouter} from 'react-router-dom';
import admin from './admin.json';
import chair from './chair.json';
import dac from './dac.json';

// It's necessary to wrap components that contain `Link` components
const WrappedManageEditDac = (props) => {
  return <BrowserRouter><ManageEditDac {...props}/></BrowserRouter>;
};

/**
 * This manage page is the pre-Data Access Agreement way to edit a DAC and will be removed when DAA work is complete.
 */
describe('ManageEditDAC Tests', () => {

  Cypress._.each([admin, chair], (user) => {
    it('Manage Edit DAC page should load for ' + user.displayName, () => {
      cy.viewport(600, 600);
      cy.stub(Storage, 'getCurrentUser').returns(user);
      cy.stub(DAC, 'get').returns(dac);
      const props = {match: {params: {dacId: dac.dacId}}};
      mount(WrappedManageEditDac(props));
      cy.contains(dac.name).should('exist');
      cy.get('[data-cy="dac_name"]').should('not.be.disabled');
      cy.get('[data-cy="dac_description"]').should('not.be.disabled');
      cy.get('[data-cy="dac_email"]').should('not.be.disabled');
      cy.get('[data-cy="btn_save"]').should('not.be.disabled');
      cy.get('[data-cy="btn_cancel"]').should('not.be.disabled');
    });
  });

});
