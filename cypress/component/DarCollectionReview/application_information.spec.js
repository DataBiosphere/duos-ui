/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
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

  it('renders the local computing information', () => {
    const props = {
      localComputing: false,
    };
    mount(<ApplicationInformation {...props}/>);
    const requestLabel = cy.get('#local-computing-label');
    expect(requestLabel).to.exist;
    requestLabel.contains('Requesting permission to use local computing');
    const requestSpan = cy.get('#local-computing-span');
    expect(requestSpan).to.exist;
    requestSpan.contains('No');
  });

  it('renders a list of external collaborators', () => {
    const props = {
      externalCollaborators: [{name: 'Person A'}, {name: 'Person B'}]
    };
    mount(<ApplicationInformation {...props} />);
    const requestLabel = cy.get('#external-collaborators-label');
    expect(requestLabel).to.exist;
    requestLabel.contains('External Collaborators');
    const requestSpan = cy.get('#external-collaborators-span');
    expect(requestSpan).to.exist;
    requestSpan.contains('Person A, Person B');
  });

  it('renders a list of internal collaborators', () => {
    const props = {
      internalCollaborators: [{ name: 'Person C' }, { name: 'Person D' }],
    };
    mount(<ApplicationInformation {...props} />);
    const requestLabel = cy.get('#internal-collaborators-label');
    expect(requestLabel).to.exist;
    requestLabel.contains('Internal Collaborators');
    const requestSpan = cy.get('#internal-collaborators-span');
    expect(requestSpan).to.exist;
    requestSpan.contains('Person C, Person D');
  });

  it('renders a list of internal lab staff', () => {
    const props = {
      internalLabStaff: [{ name: 'Person E' }, { name: 'Person F' }],
    };
    mount(<ApplicationInformation {...props} />);
    const requestLabel = cy.get('#internal-lab-staff-label');
    expect(requestLabel).to.exist;
    requestLabel.contains('Internal Lab Staff');
    const requestSpan = cy.get('#internal-lab-staff-span');
    expect(requestSpan).to.exist;
    requestSpan.contains('Person E, Person F');
  });

  it('renders the signing official and signing official email', () => {
    const props = {
      signingOfficial: 'Person SO',
      signingOfficialEmail: 'test@test.com',
    };
    mount(<ApplicationInformation {...props} />);
    const nameLabel = cy.get('#signing-official-label');
    expect(nameLabel).to.exist;
    nameLabel.contains('Signing Official');

    const nameSpan =  cy.get('#signing-official-span');
    expect(nameSpan).to.exist;
    nameSpan.contains('Person SO');

    const emailLabel = cy.get('#signing-official-email-label');
    expect(emailLabel).to.exist;
    emailLabel.contains('Signing Official Email');

    const emailSpan = cy.get('#signing-official-email-span');
    expect(emailSpan).to.exist;
    emailSpan.contains('test@test.com');
  });

  it('renders the IT director and IT director email', () => {
    const props = {
      itDirector: 'Person SO',
      itDirectorEmail: 'test@test.com',
    };
    mount(<ApplicationInformation {...props} />);
    const nameLabel = cy.get('#it-director-label');
    expect(nameLabel).to.exist;
    nameLabel.contains('IT Director');

    const nameSpan = cy.get('#it-director-span');
    expect(nameSpan).to.exist;
    nameSpan.contains('Person SO');

    const emailLabel = cy.get('#it-director-email-label');
    expect(emailLabel).to.exist;
    emailLabel.contains('IT Director Email');

    const emailSpan = cy.get('#it-director-email-span');
    expect(emailSpan).to.exist;
    emailSpan.contains('test@test.com');
  });

  it('redners AnVIL storage information', ()=> {
    const props = {
      anvilStorage: true
    };

    mount(<ApplicationInformation {...props} />);
    const anvilSpan = cy.get('#anvil-storage-span');
    expect(anvilSpan).to.exist;
    anvilSpan.contains('Yes');

    const anvilLabel = cy.get('#anvil-storage-label');
    expect(anvilLabel).to.exist;
    anvilLabel.contains('Using AnVIL only for storage and analysis');
  });
});

