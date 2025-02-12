/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import DataUseAlertBox from '../../../src/components/collection_voting_slab/DataUseAlertBox';

const dataUseManualReviewTrue = {
  'code': 'ABC',
  'description': 'data use 1',
  'manualReview': true,
};

const dataUseManualReviewTrue2 = {
  'code': 'DEF',
  'description': 'data use 2',
  'manualReview': true,
};

const dataUseManualReviewFalse = {
  'code': 'MNOP',
  'description': 'data use 3',
  'manualReview': false,
};

const dataUseNoManualReview = {
  'code': 'XYZ',
  'description': 'data use 4',
};



describe('DataUseAlertBox - Tests', function() {
  it('Renders the alert box and exclamation point when translated data use a manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'primary': [dataUseManualReviewTrue]}}
      />
    );
    const component = cy.get('[datacy=alert-box]').should('be.visible');
    component.contains('!');
  });

  it('Does not render the alert box and exclamation point when translated data use a manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'primary': [dataUseManualReviewFalse]}}
      />
    );
    cy.get('[datacy=alert-box]').should('not.exist');
  });

  it('Does not render the description of a data use without a manuallyReviewed attribute', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'primary': [dataUseNoManualReview]}}
      />
    );
    cy.get('[datacy=alert-box]').should('not.exist');
  });

  it('Renders the description of a primary use manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'primary': [dataUseManualReviewTrue], 'secondary': [dataUseManualReviewFalse]}}
      />
    );
    cy.get('[datacy=alert-box]').should('be.visible');
    cy.contains('data use 1');
    cy.get('data use 2').should('not.exist');
  });

  it('Renders the description of a secondary use manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'primary': [dataUseManualReviewFalse], 'secondary': [dataUseManualReviewTrue]}}
      />
    );
    cy.get('[datacy=alert-box]').should('be.visible');
    cy.contains('data use 1');
    cy.get('data use 3').should('not.exist');
  });

  it('Renders the description multiple manually reviewed data uses in the same category', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'Primary': [dataUseManualReviewTrue, dataUseManualReviewTrue2]}}
      />
    );
    cy.get('[datacy=alert-box]').should('be.visible');
    cy.contains('data use 1');
    cy.contains('data use 2');
  });

  it('Renders the description multiple manually reviewed data uses in different categories', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={{'primary': [dataUseManualReviewTrue2], 'secondary': [dataUseManualReviewTrue]}}
      />
    );
    cy.get('[datacy=alert-box]').should('be.visible');
    cy.contains('data use 1');
    cy.contains('data use 2');
  });
});