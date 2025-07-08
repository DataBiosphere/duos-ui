import React from 'react';
import { mount } from 'cypress/react';
import { DAA } from 'src/libs/ajax/DAA';
import { DAC } from 'src/libs/ajax/DAC';
import { Storage } from 'src/libs/storage';
import EditDac from 'src/pages/manage_dac/EditDac';
import { BrowserRouter } from 'react-router-dom';
import admin from './admin.json';
import chair from './chair.json';
import daas from './daas.json';
import dac from './dac.json';
import { setUserRoleStatuses } from 'src/libs/utils';

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

  it('Admins can create a DAC', () => {
    cy.viewport(600, 600);
    Storage.clearStorage();
    setUserRoleStatuses(admin, Storage);
    cy.stub(DAA, 'getDaas').returns(daas);
    cy.stub(DAC, 'removeDacMember').returns(Promise.resolve(200));
    cy.stub(DAC, 'addDacChair').returns(Promise.resolve(200));
    cy.stub(DAC, 'removeDacChair').returns(Promise.resolve(200));
    cy.stub(DAC, 'addDacMember').returns(Promise.resolve(200));
    cy.stub(DAA, 'addDaaToDac').returns(Promise.resolve(200));
    const props = {
      match: {
        params: {
          dacId: undefined
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(WrappedEditDac(props));
    cy.get('[data-cy="dac_name"]').should('not.be.disabled');
    cy.get('[data-cy="dac_name"]').should('be.empty');
    cy.get('[data-cy="dac_description"]').should('not.be.disabled');
    cy.get('[data-cy="dac_description"]').should('be.empty');
    cy.get('[data-cy="dac_email"]').should('not.be.disabled');
    cy.get('[data-cy="dac_email"]').should('be.empty');
    cy.get('[data-cy="btn_save"]').should('not.be.disabled');
    cy.get('[data-cy="btn_cancel"]').should('not.be.disabled');

    // Create a DAC
    const dacCreate = cy.stub(DAC, 'create').returns(dac);

    cy.get('[data-cy="dac_name"]').type('New DAC Name');
    cy.get('[data-cy="dac_description"]').type('New DAC Description');
    cy.get('[data-cy="dac_email"]').type('New DAC Email');
    cy.get('[data-cy="daa_radio"]').first().check();
    cy.get('[data-cy="btn_save"]').click();
    cy.wrap(dacCreate).should('have.been.called');
  });

  it('Chairs cannot create a DAC', () => {
    cy.viewport(600, 600);
    Storage.clearStorage();
    setUserRoleStatuses(chair, Storage);
    cy.stub(DAA, 'getDaas').returns(daas);
    cy.stub(DAC, 'removeDacMember').returns(Promise.resolve(200));
    cy.stub(DAC, 'addDacChair').returns(Promise.resolve(200));
    cy.stub(DAC, 'removeDacChair').returns(Promise.resolve(200));
    cy.stub(DAC, 'addDacMember').returns(Promise.resolve(200));
    cy.stub(DAA, 'addDaaToDac').returns(Promise.resolve(200));
    const props = {
      match: {
        params: {
          dacId: undefined
        }
      },
      history: {
        push() {
        }
      }
    };
    mount(WrappedEditDac(props));

    // Try to create a DAC
    const dacCreate = cy.stub(DAC, 'create');
    cy.get('[data-cy="dac_name"]').type('New DAC Name');
    cy.get('[data-cy="dac_description"]').type('New DAC Description');
    cy.get('[data-cy="dac_email"]').type('New DAC Email');
    cy.get('[data-cy="daa_radio"]').first().check();
    cy.get('[data-cy="btn_save"]').click();
    cy.wrap(dacCreate).should('not.have.been.called');
  });

});
