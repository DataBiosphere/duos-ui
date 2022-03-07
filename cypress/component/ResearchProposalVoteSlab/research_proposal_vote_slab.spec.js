/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";
import ResearchProposalVoteSlab from "../../../src/components/collection_voting_slab/ResearchProposalVoteSlab";


const darInfoPrimaryUseManualReviewFalse = {
  "rus": "test",
  "methods": true
};

const darInfoSecondaryUseManualReviewTrue = {
  "stigmatizedDiseases": true
};

const darInfoPrimarySecondaryUse = {
  "diseases": true,
  "poa": true
};


describe('ResearchProposalVoteSlab - Tests', function() {
  it('Renders title of slab', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    component.contains('slab_title');
  });

  it('Does not render expanded view when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    component.get('srp_expanded').should('not.be.visible');
  });

  it('Renders primary data use pill', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    const collapsedView = component.get('srp_collapsed');
    collapsedView.contains('Primary:');
    collapsedView.contains('data_use_pill_');
    collapsedView.should('not.contain', 'Secondary:');
  });

  it('Renders secondary data use pill', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    const collapsedView = component.get('srp_collapsed');
    collapsedView.contains('Secondary:');
    collapsedView.contains('data_use_pill_');
    collapsedView.should('not.contain', 'Primary:');
  });

  it('Renders primary and secondary data use pills', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    const collapsedView = component.get('srp_collapsed');
    collapsedView.contains('Primary:');
    collapsedView.contains('Secondary:');
    collapsedView.contains('data_use_pill_');
  });

  it('Renders link to expand when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    const collapsedView = component.get('srp_collapsed');
    collapsedView.contains('link_srp_collapse_expand');
    collapsedView.contains('Expand to view Research Purpose and Vote');
  });

  it('Renders link to collapse when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        expanded={true}
      />
    );
    const component = cy.get('srp_slab');
    const collapsedView = component.get('srp_collapsed');
    collapsedView.contains('link_srp_collapse_expand');
    collapsedView.contains('Hide Research Purpose and Vote');
  });

  it('Renders data use pills when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        expanded={true}
      />
    );
    const component = cy.get('srp_slab');
    const collapsedView = component.get('srp_collapsed');
    component.get('srp_expanded').should('be.visible');
    collapsedView.contains('Primary:');
    collapsedView.contains('Secondary:');
    collapsedView.contains('data_use_pill_');
  });

  it('Renders research purpose when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        expanded={true}
      />
    );
    const component = cy.get('srp_slab');
    const expandedView = component.get('srp_expanded');
    expandedView.contains('research_purpose');
    expandedView.contains('test');
  });

  it('Does not render research purpose when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    const expandedView = component.get('srp_expanded');
    expandedView.get('research_purpose').should('not.be.visible');
    expandedView.should('not.contain','test');
  });

  it('Renders data use alert box when expanded with manually reviewed data uses', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        expanded={true}
      />
    );
    const component = cy.get('srp_slab');
    const expandedView = component.get('srp_expanded');
    expandedView.contains('data_use_alert_box');
  });

  it('Does not render data use alert box when expanded with manually reviewed data uses', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        expanded={true}
      />
    );
    const component = cy.get('srp_slab');
    const expandedView = component.get('srp_expanded');
    expandedView.should('not.contain','data_use_alert_box');
  });

  it('Does not render data use alert box when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        expanded={false}
      />
    );
    const component = cy.get('srp_slab');
    const expandedView = component.get('srp_expanded');
    expandedView.should('not.contain','data_use_alert_box');
  });
});