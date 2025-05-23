import React from 'react';
import {mount} from 'cypress/react';
import SummarySection from 'src/pages/progress_reports/SummarySection';
import { FORM_TEXT_AREA_MAX_LENGTH } from 'src/components/forms/formConstants';
import {Location} from 'history';
import {DuosUser} from 'src/types/model';
import {PublicationOrPresentation} from "src/components/publications_list/PublicationOrPresentation";

describe('Summary Section - Component Tests', () => {
  let onFormChangeSpy: () => void;

  const location: Location = {
    pathname: '/progress-report-application',
    search: '',
    hash: '',
    state: {},
    key: 'testKey'
  };

  const researcher: DuosUser = {
    createDate: new Date(),
    displayName: 'Test User',
    email: 'user@test.com',
    emailPreference: true,
    eraCommonsId: 'commons-id',
    isAdmin: false,
    isAlumni: false,
    isChairPerson: false,
    isDataSubmitter: false,
    isMember: false,
    isResearcher: true,
    isSigningOfficial: false,
    roles: [{
      roleId: 1,
      name: 'Researcher',
      userId: 1,
      userRoleId: 1,
    }],
    userId: 1
  };

  const initialPublications: PublicationOrPresentation[] = [
    {
      title: 'Test Publication 1',
      date: '2022-01-01',
      bibliographic_citation: 'Citation 1',
      did_cite: true,
      pubmed_id: '12345',
      authors: 'Author 1, Author 2',
      dataset_citation: 'Dataset Citation 1',
      link: 'http://example.com/1'
    },
    {
      title: 'Test Publication 2',
      date: '2022-02-01',
      bibliographic_citation: 'Citation 2',
      did_cite: true,
      pubmed_id: '67890',
      authors: 'Author 3, Author 4',
      dataset_citation: 'Dataset Citation 2',
      link: 'http://example.com/2'
    }
  ];

  const mountComponent = (customState = {}) => {
    const formState = {...customState};

    const props = {
      readOnly: false,
      formState,
      onFormChange: onFormChangeSpy,
      location,
      researcher,
    };

    return mount(<SummarySection {...props} />);
  };

  beforeEach(() => {
    onFormChangeSpy = cy.stub().as('formChangeStub');
    mountComponent();
  });

  it('renders the component correctly', () => {
    cy.get('[data-cy=summary-section]').should('exist');
    cy.contains('Step 1: Submit a Progress Report').should('be.visible');
    cy.contains('1.1 Summary of Progress').should('be.visible');
    cy.contains('1.2 Intellectual Property').should('be.visible');
    cy.contains('1.3 Publications').should('be.visible');
    cy.contains('1.4 Presentations').should('be.visible');
  });

  it('renders in read-only mode correctly', () => {
    const props = {
      readOnly: true,
      formState: {},
      onFormChange: onFormChangeSpy,
      location,
      researcher,
    };

    mount(<SummarySection {...props} />);
    cy.contains('Review a Progress Report').should('be.visible');
  });

  it('displays the correct descriptions for each section', () => {
    cy.contains('Please summarize your research on this project since your initial request or most recent renewal').should('be.visible');
    cy.contains('Have you generated any intellectual property since your last renewal').should('be.visible');
    cy.contains('Have you published in any publications since your last renewal').should('be.visible');
    cy.contains('Have you published in any presentations since your last renewal').should('be.visible');
  });

  it('handles summary text input', () => {
    const testSummary = 'This is a test summary of my research progress.';
    cy.get('#progressReportSummary').type(testSummary);
    cy.get('#progressReportSummary').should('have.value', testSummary);

    cy.get('@formChangeStub').should('have.been.called');
  });

  it('enforces character limit on summary text', () => {
    const longText = 'A'.repeat(FORM_TEXT_AREA_MAX_LENGTH + 100);
    const expectedText = longText.substring(0, FORM_TEXT_AREA_MAX_LENGTH);

    cy.get('#progressReportSummary').type(longText, {delay: 0});
    cy.get('#progressReportSummary').should('have.value', expectedText);
  });

  it('handles intellectual property radio buttons', () => {
    cy.contains('label', 'Yes').find('input[type="radio"]').first().click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', {intellectualPropertyYesNo: true});

    cy.contains('label', 'No').find('input[type="radio"]').first().click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', {intellectualPropertyYesNo: false});
  });

  it('shows intellectual property details form when "Yes" is selected', () => {
    mountComponent({intellectualPropertyYesNo: true});
    cy.get('#intellectualPropertySummary').should('exist');

    const testDetails = 'Details about intellectual property.';
    cy.get('#intellectualPropertySummary').type(testDetails);
    cy.get('#intellectualPropertySummary').should('have.value', testDetails);

    cy.get('@formChangeStub').should('have.been.called');
  });

  it('handles publications radio buttons', () => {
    cy.get('#publicationsYesNo').parent().contains('label', 'Yes').find('input[type="radio"]').click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', {publicationsYesNo: true});

    cy.get('#publicationsYesNo').parent().contains('label', 'No').find('input[type="radio"]').click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', {publicationsYesNo: false});
  });

  it('shows publications list when "Yes" is selected', () => {
    mountComponent({publicationsYesNo: true});
    cy.contains('Add Publication').should('exist');
  });

  it('handles presentations radio buttons', () => {
    cy.get('#presentationsYesNo').parent().contains('label', 'Yes').find('input[type="radio"]').click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', {presentationsYesNo: true});

    cy.get('#presentationsYesNo').parent().contains('label', 'No').find('input[type="radio"]').click({force: true});
    cy.get('@formChangeStub').should('have.been.calledWith', {presentationsYesNo: false});
  });

  it('shows presentations list when "Yes" is selected', () => {
    mountComponent({presentationsYesNo: true});
    cy.contains('Add Presentation').should('exist');
  });

  it('displays preloaded publications', () => {
    mountComponent({publicationsYesNo: true, publications: initialPublications});

    cy.contains('Test Publication 1').should('be.visible');
    cy.contains('Test Publication 2').should('be.visible');
    cy.contains('2022-01-01').should('be.visible');
    cy.contains('2022-02-01').should('be.visible');
  });

  it('displays preloaded presentations', () => {
    mountComponent({presentationsYesNo: true, presentations: initialPublications});

    cy.contains('Test Publication 1').should('be.visible');
    cy.contains('Test Publication 2').should('be.visible');
    cy.contains('2022-01-01').should('be.visible');
    cy.contains('2022-02-01').should('be.visible');
  });

  it('shows era authenticated researcher commons id', () => {
    const eraAuthedResearcher: DuosUser = {
      ...researcher, properties: [
        {
          propertyId: 1,
          userId: 1,
          propertyKey: 'eraAuthorized',
          propertyValue: 'true'
        },
        {
          propertyId: 2,
          userId: 1,
          propertyKey: 'eraExpiration',
          // 86400000 = 1 day in milliseconds
          propertyValue: (new Date().getTime() + 86400000).toString(),
        }
      ]
    };
    const props = {
      readOnly: true,
      formState: {},
      onFormChange: onFormChangeSpy,
      location,
      researcher: eraAuthedResearcher,
    };
    mount(<SummarySection {...props} />);
    cy.get('[data-cy=researcher-identification]').should('exist');
    cy.get('[data-cy=researcher-identification]').should(($p) => {
      expect($p).to.contain(eraAuthedResearcher.eraCommonsId);
    })
  });

  it('shows authentication message for un-auth-ed user', () => {
    mountComponent();
    cy.get('[data-cy=researcher-identification]').should('exist');
    cy.get('[data-cy=researcher-identification]').should(($p) => {
      expect($p).to.contain('Authenticate your account');
    })
  });
});
