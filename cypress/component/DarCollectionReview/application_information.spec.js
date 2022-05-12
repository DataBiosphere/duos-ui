/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import ApplicationInformation from '../../../src/pages/dar_collection_review/ApplicationInformation';

describe('Application Information', () => {
  it('renders the page', () => {
    const props = {};
    mount(<ApplicationInformation {...props}/>);
    const container = cy.get('.application-information-page');
    expect(container).to.exist;
  });

  it('renders researcher information', () => {
    const props = {researcher: 'test person'};
    mount(<ApplicationInformation {...props} />);

    const label = cy.get(`#researcher-label`);
    expect(label).to.exist;
    label.contains('Researcher');
    const value = cy.get(`#researcher-span`);
    expect(value).to.exist;
    value.contains('test person');
  });

  it('renders email information', () => {
    const props = {email: 'test email'};
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#researcher-email-label`);
    expect(label).to.exist;
    label.contains('Researcher Email');
    const value = cy.get(`#researcher-email-span`);
    expect(value).to.exist;
    value.contains('test email');
  });

  it('renders department information', () => {
    const props = {department: 'test'};
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#department-label`);
    expect(label).to.exist;
    label.contains('Department');
    const value = cy.get(`#department-span`);
    expect(value).to.exist;
    value.contains('test');
  });

  it('renders city information', () => {
    const props = {city: 'test'};
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#city-label`);
    expect(label).to.exist;
    label.contains('City');
    const value = cy.get(`#city-span`);
    value.contains('test');
  });

  it('renders country information', () => {
    const props = {country: 'test'};
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#country-label`);
    expect(label).to.exist;
    label.contains('Country');
    const value = cy.get(`#country-span`);
    value.contains('test');
  });

  it('renders institution information', () => {
    const props = {institution: 'test'};
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#institution-label`);
    expect(label).to.exist;
    label.contains('Institution');
    const value = cy.get(`#institution-span`);
    expect(value).to.exist;
    value.contains('test');
  });

  it('renders Principal Investigator information', () => {
    const props = { pi: 'test' };
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#principal-investigator-label`);
    expect(label).to.exist;
    label.contains('Principal Investigator');
    const value = cy.get(`#principal-investigator-span`);
    expect(value).to.exist;
    value.contains('test');
  });

  it('renders Principal Investigator Email information', () => {
    const props = { piEmail: 'test' };
    mount(<ApplicationInformation {...props} />);
    const label = cy.get(`#pi-email-label`);
    expect(label).to.exist;
    label.contains('Principal Investigator Email');
    const value = cy.get(`#pi-email-span`);
    expect(value).to.exist;
    value.contains('test');
  });

  it('renders the Non Technical Summary', () => {
    const props = {nonTechSummary: 'test'};
    mount(<ApplicationInformation {...props} />);
    const subheader = cy.get('.non-technical-summary-subheader');
    expect(subheader).to.exist;
    const textbox = cy.get('.non-technical-summary-textbox');
    expect(textbox).to.exist;
    textbox.contains('test');
  });

  it('renders the application details container and sub-header', () => {
    const props = {};
    mount(<ApplicationInformation {...props} />);
    const container = cy.get('.application-details-container');
    expect(container).to.exist;

    const subheader = cy.get('.application-details-subheader');
    expect(subheader).to.exist;
    subheader.contains('Application Details');
  });

  it('renders the cloud computing provider information if provided', () => {
    const props = {
      cloudProvider: 'test name',
      cloudProviderDescription: 'test description',
      cloudComputing: true
    };

    mount(<ApplicationInformation {...props} />);
    const requestLabel = cy.get('#cloud-computing-label');
    expect(requestLabel).to.exist;
    requestLabel.contains('Requesting permission to use cloud computing');
    const requestSpan = cy.get('#cloud-computing-span');
    expect(requestSpan).to.exist;
    requestSpan.contains('Yes');
    const cloudProviderLabel = cy.get('#cloud-provider-label');
    expect(cloudProviderLabel).to.exist;
    cloudProviderLabel.contains('Cloud Provider (description below');
    const cloudProviderSpan = cy.get('#cloud-provider-span');
    expect(cloudProviderSpan).to.exist;
    cloudProviderSpan.contains('test name');
    const cloudProviderDescription = cy.get('.cloud-provider-description-textbox');
    expect(cloudProviderDescription).to.exist;
    cloudProviderDescription.contains('test description');
  });

  it('hides the cloud computing details if cloud computing is false', () => {
    const props = {
      cloudProvider: 'test name',
      cloudProviderDescription: 'test description',
      cloudComputing: false,
    };

    mount(<ApplicationInformation {...props} />);
    const requestLabel = cy.get('#cloud-computing-label');
    expect(requestLabel).to.exist;
    requestLabel.contains('Requesting permission to use cloud computing');
    const requestSpan = cy.get('#cloud-computing-span');
    expect(requestSpan).to.exist;
    requestSpan.contains('No');
    const cloudProviderLabel = cy.get('#cloud-provider-label');
    cloudProviderLabel.should('not.exist');
    const cloudProviderSpan = cy.get('#cloud-provider-span');
    cloudProviderSpan.should('not.exist');
    const cloudProviderDescription = cy.get(
      '.cloud-provider-description-textbox'
    );
    cloudProviderDescription.should('not.exist');
  });

});

