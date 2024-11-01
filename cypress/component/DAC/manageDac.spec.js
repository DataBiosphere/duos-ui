/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import {DAC} from '../../../src/libs/ajax/DAC';
import {Storage} from '../../../src/libs/storage';
import ManageEditDac from '../../../src/pages/manage_dac/ManageEditDac';
import {BrowserRouter} from 'react-router-dom';

// It's necessary to wrap components that contain `Link` components
const WrappedManageEditDac = (props) => {
  return <BrowserRouter><ManageEditDac {...props}/></BrowserRouter>;
};

// Common fixture data
const admin = {
  userId: 2,
  displayName: 'Admin',
  institution: {
    id: 150,
    name: 'The Broad Institute of MIT and Harvard'
  },
  roles: [
    {
      userId: 2,
      roleId: 4,
      name: 'Admin'
    }
  ]
};

const chair = {
  userId: 1,
  displayName: 'Chairperson',
  institution: {
    id: 150,
    name: 'The Broad Institute of MIT and Harvard'
  },
  roles: [
    {
      userId: 1,
      roleId: 2,
      name: 'Chairperson',
      dacId: 1
    }
  ]
};

const dac = {
  dacId: 1,
  name: 'Test DAC',
  description: 'Test DAC',
  createDate: 'Oct 6, 2020',
  updateDate: 'Jun 27, 2024',
  chairpersons: [
    {
      userId: 1,
      email: 'test@broadinstitute.org',
      displayName: 'Chairperson',
      createDate: 1704827256598,
      roles: [
        {
          userId: 1,
          roleId: 2,
          name: 'Chairperson',
          dacId: 1
        }
      ],
      emailPreference: true,
      institutionId: 150,
      eraCommonsId: 'test'
    }
  ],
  members: [
    {
      userId: 2,
      email: 'test2@broadinstitute.org',
      displayName: 'Member',
      createDate: 1704827256598,
      roles: [
        {
          userId: 2,
          roleId: 1,
          name: 'Member',
          dacId: 1
        }
      ],
      emailPreference: true,
      institutionId: 150,
      eraCommonsId: 'test'
    }
  ],
  electionIds: [],
  datasetIds: [],
  email: 'grushton@broadinstitute.org',
  associatedDaa: {
    daaId: 1,
    createUserId: 5146,
    createDate: 1713386755554,
    updateUserId: 5146,
    updateDate: 1713386755554,
    initialDacId: 8,
    file: {
      fileStorageObjectId: 216,
      entityId: 1,
      fileName: 'test_daa.txt',
      category: 'dataAccessAgreement',
      mediaType: 'application/octet-stream',
      createUserId: 5146,
      createDate: 1713386755554,
      deleted: false
    },
    broadDaa: true
  }
};

describe('Manage DAC Tests', () => {

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
