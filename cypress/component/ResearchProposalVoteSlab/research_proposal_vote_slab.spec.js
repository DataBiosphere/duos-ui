/* eslint-disable no-undef */
import React from 'react';
import {mount} from "@cypress/react";
import ResearchProposalVoteSlab from "../../../src/components/collection_voting_slab/ResearchProposalVoteSlab";


const darInfoPrimaryUseManualReviewFalse = {
  "rus": "test",
  "diseases": true
};

const darInfoSecondaryUseManualReviewTrue = {
  "stigmatizedDiseases": true
};

const darInfoPrimarySecondaryUse = {
  "diseases": true,
  "illegalBehavior": true
};


describe('ResearchProposalVoteSlab - Tests', function() {
  it('Does not render expanded view when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    const component = cy.get('.srp-slab');
    component.get('.srp-expanded').should('not.exist');
  });

  it('Renders primary data use pill', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    cy.contains("primary");
    cy.get("secondary").should('not.exist');
  });

  it('Renders secondary data use pill', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />
    );
    cy.contains("secondary");
    cy.get("primary").should('not.exist');
  });

  it('Renders primary and secondary data use pills', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
      />
    );
    cy.contains("primary");
    cy.contains("secondary");
  });

  it('Renders link to expand when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
      />
    );
    cy.contains('Expand to view Research Purpose and Vote');
  });

  it('Renders link to collapse when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
      />
    );
    const link = cy.contains('Expand to view Research Purpose and Vote');
    link.click();
    cy.contains('Hide Research Purpose and Vote');
  });

  it('Renders data use pills when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
      />
    );
    const link = cy.contains('Expand to view Research Purpose and Vote');
    link.click();
    cy.contains("primary");
    cy.contains("secondary");
  });

  it('Renders research purpose when expanded', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    const link = cy.contains('Expand to view Research Purpose and Vote');
    link.click();
    cy.get('.research-purpose').should('exist');
    cy.contains('test');
  });

  it('Does not render research purpose when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    cy.get('.research-purpose').should('not.exist');
  });

  it('Renders data use alert box when expanded with manually reviewed data uses', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />
    );

    const link = cy.contains('Expand to view Research Purpose and Vote');
    link.click();
    cy.get('.data-use-alert-box').should('exist');
  });

  it('Does not render data use alert box when expanded with manually reviewed data uses', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />
    );
    const link = cy.contains('Expand to view Research Purpose and Vote');
    link.click();
    cy.get('.data-use-alert-box').should('not.exist');
  });

  it('Does not render data use alert box when collapsed', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />
    );
    cy.get('.data-use-alert-box').should('not.exist');
  });

  it('Does not render data use summary when loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimarySecondaryUse}
        isLoading={true}
      />
    );
    cy.get("primary").should('not.exist');
    cy.get("secondary").should('not.exist');
  });

  it('Does not render link to expand/collapse when loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        isLoading={true}
      />
    );
    cy.get('Hide Research Purpose and Vote').should('not.exist');
    cy.get('Expand to view Research Purpose and Vote').should('not.exist');
  });

  it('Renders skeleton when loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        isLoading={true}
      />
    );
    cy.get('.text-placeholder').should('exist');
  });

  it('Does not render skeleton when not loading', function() {
    mount(
      <ResearchProposalVoteSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        isLoading={false}
      />
    );
    cy.get('.text-placeholder').should('not.exist');
  });
});