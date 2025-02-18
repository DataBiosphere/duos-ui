/* eslint-disable no-undef */

import React from 'react';
import {mount} from 'cypress/react';
import {SupportRequestModal} from '../../../src/components/modals/SupportRequestModal';
import {Storage} from '../../../src/libs/storage';

const mockUser = {
  displayName: 'Display Name',
  email: 'email@test.com'
};

const handler = () => {
};

describe('Support Request Modal Tests', () => {

  beforeEach(() => {
    cy.viewport(500, 500);
    cy.initApplicationConfig();
  });

  describe('When a user is logged in:', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(true);
      cy.stub(Storage, 'getCurrentUser').returns(mockUser);
    });

    it('Renders form correctly', () => {
      mount(<SupportRequestModal
        onCloseRequest={handler}
        onOKRequest={handler}
        url={'url'}
        showModal={true}
      />);
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist');
      cy.get('[data-cy="supportForm"]').should('exist');
      cy.get('[data-cy="supportFormEmail"]').should('not.exist');
      cy.get('[data-cy="supportFormName"]').should('not.exist');
      cy.get('[data-cy="supportFormType"]').should('exist');
      cy.get('[data-cy="supportFormSubject"]').should('exist');
      cy.get('[data-cy="supportFormDescription"]').should('exist');
      cy.get('[data-cy="supportFormAttachment"]').should('exist');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled');
    });

    it('Submits properly', () => {
      mount(<SupportRequestModal
        onCloseRequest={handler}
        onOKRequest={handler}
        url={'url'}
        showModal={true}
      />);
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormType"]').select('bug');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormSubject"]').type('Subject');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormDescription"]').type('Description');
      // Form is complete:
      cy.get('[data-cy="supportFormSubmit"]').should('not.be.disabled');
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled');
      cy.intercept({method: 'POST', url: '**/support/request'}, {statusCode: 201}).as('request');
      cy.intercept({method: 'POST', url: '**/support/upload'}, {statusCode: 201, body: {'token': 'token_string'}}).as('upload');
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json'], {force: true});
      cy.get('[data-cy="supportFormSubmit"]').click();
      cy.wait(['@request', '@upload']).then((interceptions) => {
        assert(interceptions.length === 2);
      });
    });

  });

  describe('When a user is NOT logged in:', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(false);
      cy.stub(Storage, 'getCurrentUser').returns(undefined);
    });

    it('Renders form correctly', () => {
      mount(<SupportRequestModal
        onCloseRequest={handler}
        onOKRequest={handler}
        url={'url'}
        showModal={true}
      />);
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist');
      cy.get('[data-cy="supportForm"]').should('exist');
      cy.get('[data-cy="supportFormEmail"]').should('exist');
      cy.get('[data-cy="supportFormName"]').should('exist');
      cy.get('[data-cy="supportFormType"]').should('exist');
      cy.get('[data-cy="supportFormSubject"]').should('exist');
      cy.get('[data-cy="supportFormDescription"]').should('exist');
      cy.get('[data-cy="supportFormAttachment"]').should('exist');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled');
    });

    it('Submits properly', () => {
      mount(<SupportRequestModal
        onCloseRequest={handler}
        onOKRequest={handler}
        url={'url'}
        showModal={true}
      />);
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormName"]').type('Name');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormType"]').select('bug');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormSubject"]').type('Subject');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormDescription"]').type('Description');
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled');
      cy.get('[data-cy="supportFormEmail"]').type(mockUser.email);
      // Form is complete:
      cy.get('[data-cy="supportFormSubmit"]').should('not.be.disabled');
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled');
      cy.intercept({method: 'POST', url: '**/support/request'}, {statusCode: 201}).as('request');
      cy.intercept({method: 'POST', url: '**/support/upload'}, {statusCode: 201, body: {'token': 'token_string'}}).as('upload');
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json'], {force: true});
      cy.get('[data-cy="supportFormSubmit"]').click();
      cy.wait(['@request', '@upload']).then((interceptions) => {
        assert(interceptions.length === 2);
      });
    });

  });

  describe('File Attachments', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(false);
      cy.stub(Storage, 'getCurrentUser').returns(undefined);
    });
    it('Single attachment displayed', () => {
      mount(<SupportRequestModal
        onCloseRequest={handler}
        onOKRequest={handler}
        url={'url'}
        showModal={true}
      />);
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json'], {force: true});
      const container = cy.get('[data-cy="supportFormAttachmentContainer"]');
      expect(container.contains('example.json'));
    });

    it('Multiple attachments displayed', () => {
      mount(<SupportRequestModal
        onCloseRequest={handler}
        onOKRequest={handler}
        url={'url'}
        showModal={true}
      />);
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json', 'cypress/fixtures/dataset-registration-schema_v1.json'], {force: true});
      const container = cy.get('[data-cy="supportFormAttachmentContainer"]');
      expect(container.contains('2 files selected'));
    });
  });
});
