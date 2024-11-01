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

describe('ManageEditDAC Tests', () => {

  Cypress._.each([admin, chair], (user) => {
    it('Should Load for ' + user.displayName, () => {
      cy.viewport(600, 600);
      cy.stub(Storage, 'getCurrentUser').returns(user);
      cy.stub(DAC, 'get').returns(dac);
      const props = {match: {params: {dacId: 1}}};
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
