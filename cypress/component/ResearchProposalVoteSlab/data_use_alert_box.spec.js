/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import DataUseAlertBox from "../../../src/components/collection_voting_slab/DataUseAlertBox";

const dataUseManualReviewTrue = {
  "code": "ABC",
  "description": "data use 1",
  "manualReview": true,
};

const dataUseManualReviewTrue2 = {
  "code": "DEF",
  "description": "data use 2",
  "manualReview": true,
};

const dataUseManualReviewFalse = {
  "code": "MNOP",
  "description": "data use 3",
  "manualReview": false,
};

const dataUseNoManualReview = {
  "code": "XYZ",
  "description": "data use 4",
};



describe('DataUseAlertBox - Tests', function() {
  it('Renders the alert box and exclamation point when translated data use a manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseManualReviewTrue]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('be.visible');
    component.contains('!');
  });

  it('Does not render the alert box and exclamation point when translated data use a manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseManualReviewFalse]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('not.be.visible');
    component.get('data_use_descriptions').should('be.empty');
  });

  it('Does not render the description of a data use without a manuallyReviewed attribute', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseNoManualReview]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('not.be.visible');
    component.get('data_use_descriptions').should('be.empty');
  });

  it('Renders the description of a primary use manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseManualReviewTrue]}, {"Secondary": [dataUseManualReviewFalse]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('be.visible');
    const descriptions = component.get('data_use_descriptions');
    descriptions.contains('data use 1');
    descriptions.should('not.contain', 'data use 2');
  });

  it('Renders the description of a secondary use manually reviewed data use', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseManualReviewFalse]}, {"Secondary": [dataUseManualReviewTrue]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('be.visible');
    const descriptions = component.get('data_use_descriptions');
    descriptions.contains('data use 1');
    descriptions.should('not.contain', 'data use 3');
  });

  it('Renders the description multiple manually reviewed data uses in the same category', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseManualReviewTrue, dataUseManualReviewTrue2]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('be.visible');
    const descriptions = component.get('data_use_descriptions');
    descriptions.contains('data use 1');
    descriptions.contains('data use 2');
  });

  it('Renders the description multiple manually reviewed data uses in different categories', function() {
    mount(
      <DataUseAlertBox
        translatedDataUse={[{"Primary": [dataUseManualReviewTrue2]}, {"Secondary": [dataUseManualReviewTrue]}]}
      />
    );
    const component = cy.get('data_use_description_box').should('be.visible');
    const descriptions = component.get('data_use_descriptions');
    descriptions.contains('data use 1');
    descriptions.contains('data use 2');
  });
});