import React from 'react';
import { mount } from 'cypress/react';
import { ProgressReportApplication } from 'src/pages/dar_application/ProgressReportApplication';
import { DataAccessRequest, Dataset, DuosUser } from 'src/types/model';
import { History, Location } from 'history';

describe('ProgressReportApplication - Component Tests', () => {
  let mockHistory: History;

  beforeEach(() => {
    cy.initApplicationConfig();

    // Mock the utility functions that the component uses
    cy.stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve([])
    });

    // Mock Storage methods that might be used
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });

    // Create mock history with stubs inside beforeEach
    mockHistory = {
      length: 1,
      action: 'POP',
      location: {
        pathname: '/test',
        search: '',
        hash: '',
        state: null,
        key: 'testkey'
      },
      push: cy.stub(),
      replace: cy.stub(),
      go: cy.stub(),
      goBack: cy.stub(),
      goForward: cy.stub(),
      block: cy.stub(),
      listen: cy.stub(),
      createHref: cy.stub()
    } as any;
  });

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

  const mockDatasets: Dataset[] = [
    {
      datasetId: 1,
      name: 'Test Dataset',
      dacApproval: true,
      dataUse: { generalUse: true }
    } as any
  ];

  const baseDar: DataAccessRequest = {
    referenceId: 'DAR-123',
    collectionId: 1,
    elections: {},
    darCode: 'DAR-123',
    createDate: new Date(),
    sortDate: new Date(),
    submissionDate: new Date(),
    updateDate: new Date()
  } as any;

  const mountComponent = (dar: Partial<DataAccessRequest> = {}, readOnly = true) => {
    const fullDar = { ...baseDar, ...dar } as DataAccessRequest;

    const props = {
      dar: fullDar,
      datasets: mockDatasets,
      readOnlyMode: readOnly,
      history: mockHistory,
      location,
      researcher
    };

    return mount(<ProgressReportApplication {...props} />);
  };

  it('renders the component without errors', () => {
    // Mount component with basic DAR
    const basicDar = {
      intellectualPropertySummary: undefined
    };

    mountComponent(basicDar, true);

    // Just check that the component renders by looking for the step container
    cy.get('.accordion-step-container').should('exist');
  });

  it('defaults intellectualPropertyYesNo to false when dar.intellectualPropertySummary is undefined', () => {
    // Mount component with DAR that has undefined intellectualPropertySummary
    const darWithoutIntellectualProperty = {
      intellectualPropertySummary: undefined
    };

    mountComponent(darWithoutIntellectualProperty, true);

    // Check that the intellectual property "No" radio button is checked (false state)
    cy.get('#intellectualPropertyYesNo_no').should('be.checked');
    cy.get('#intellectualPropertyYesNo_yes').should('not.be.checked');
  });

  it('sets intellectualPropertyYesNo to true when dar.intellectualPropertySummary has a value', () => {
    // Mount component with DAR that has intellectualPropertySummary
    const darWithIntellectualProperty = {
      intellectualPropertySummary: 'Some intellectual property description'
    };

    mountComponent(darWithIntellectualProperty, true);

    // Check that the intellectual property "Yes" radio button is checked (true state)
    cy.get('#intellectualPropertyYesNo_yes').should('be.checked');
    cy.get('#intellectualPropertyYesNo_no').should('not.be.checked');
  });

  it('defaults publicationsYesNo to false when dar.publications is undefined or empty', () => {
    // Test with undefined publications
    const darWithoutPublications = {
      publications: undefined
    };

    mountComponent(darWithoutPublications, true);

    // Check that the publications "No" radio button is checked (false state)
    cy.get('#publicationsYesNo_no').should('be.checked');
    cy.get('#publicationsYesNo_yes').should('not.be.checked');
  });

  it('defaults publicationsYesNo to false when dar.publications is empty array', () => {
    // Test with empty publications array
    const darWithEmptyPublications = {
      publications: []
    };

    mountComponent(darWithEmptyPublications, true);

    // Check that the publications "No" radio button is checked (false state)
    cy.get('#publicationsYesNo_no').should('be.checked');
    cy.get('#publicationsYesNo_yes').should('not.be.checked');
  });

  it('sets publicationsYesNo to true when dar.publications has items', () => {
    // Test with publications array containing items
    const darWithPublications = {
      publications: ['Publication 1', 'Publication 2']
    };

    mountComponent(darWithPublications, true);

    // Check that the publications "Yes" radio button is checked (true state)
    cy.get('#publicationsYesNo_yes').should('be.checked');
    cy.get('#publicationsYesNo_no').should('not.be.checked');
  });

  it('defaults presentationsYesNo to false when dar.presentations is undefined', () => {
    const darWithoutPresentations = {};

    mountComponent(darWithoutPresentations, true);

    // Check that the presentations "No" radio button is checked (false state)
    cy.get('#presentationsYesNo_no').should('be.checked');
    cy.get('#presentationsYesNo_yes').should('not.be.checked');
  });

  it('defaults presentationsYesNo to false when dar.presentations is undefined', () => {
    const darWithEmptyPresentations = {};

    mountComponent(darWithEmptyPresentations, true);

    // Check that the presentations "No" radio button is checked (false state)
    cy.get('#presentationsYesNo_no').should('be.checked');
    cy.get('#presentationsYesNo_yes').should('not.be.checked');
  });

  it('sets presentationsYesNo to true when dar.presentations has items', () => {
    const darWithPresentations = {
      presentations: ['Presentation 1', 'Presentation 2']
    };

    mountComponent(darWithPresentations, true);

    // Check that the presentations "Yes" radio button is checked (true state)
    cy.get('#presentationsYesNo_yes').should('be.checked');
    cy.get('#presentationsYesNo_no').should('not.be.checked');
  });

  it('defaults dmiYesNo to false when dar.dmi is undefined', () => {
    const darWithoutDmi = {};

    mountComponent(darWithoutDmi, true);

    // Check that the DMI "No" radio button is checked (false state)
    cy.get('#dmiYesNo_no').should('be.checked');
    cy.get('#dmiYesNo_yes').should('not.be.checked');
  });

  it('defaults dmiYesNo to false when dar.dmi.incidents is undefined', () => {
    const darWithEmptyDmiIncidents = {};

    mountComponent(darWithEmptyDmiIncidents, true);

    // Check that the DMI "No" radio button is checked (false state)
    cy.get('#dmiYesNo_no').should('be.checked');
    cy.get('#dmiYesNo_yes').should('not.be.checked');
  });

  it('sets dmiYesNo to true when dar.dmi.incidents has items', () => {
    // Test with dmi incidents array containing realistic incident types
    // These match the FormStateKey enum values that would be generated by getDataManagementIncidents()
    const darWithDmiIncidents = {
      dmi: {
        incidents: ['dmiCombination', 'dmiSharing', 'dmiSecurity'],
        description: 'There were incidents involving inappropriate dataset combination, unauthorized data sharing, and security breaches during the research period.'
      }
    };

    mountComponent(darWithDmiIncidents, true);

    // Check that the DMI "Yes" radio button is checked (true state)
    cy.get('#dmiYesNo_yes').should('be.checked');
    cy.get('#dmiYesNo_no').should('not.be.checked');
  });

  it('defaults closeoutYesNo to false when dar.closeoutSupplement is undefined', () => {
    // Test with undefined closeoutSupplement
    const darWithoutCloseout = {};

    mountComponent(darWithoutCloseout, true);

    // Check that the closeout "No" radio button is checked (false state)
    cy.get('#closeoutYesNo_no').should('be.checked');
    cy.get('#closeoutYesNo_yes').should('not.be.checked');
  });

  it('sets closeoutYesNo to true when closeoutSupplement is in dar and reasons is a non-empty list', () => {
    const darWithCloseout = {
      closeoutSupplement: {
        reasons: ['closeoutProjectCompleted'],
        otherText: '',
        signingOfficialId: 1
      }
    };

    mountComponent(darWithCloseout, true);

    // Check that the closeout "Yes" radio button is checked (true state)
    cy.get('#closeoutYesNo_yes').should('be.checked');
    cy.get('#closeoutYesNo_no').should('not.be.checked');
  });
});
