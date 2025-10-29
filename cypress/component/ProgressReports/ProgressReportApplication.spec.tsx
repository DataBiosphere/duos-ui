import React, { ReactNode } from 'react'
import { mount } from 'cypress/react'
import { ProgressReportApplication } from 'src/pages/dar_application/ProgressReportApplication'
import { CombinedDataAccessRequest, Dataset, DuosUser, FileStorageObject } from 'src/types/model'
import { History, Location, Action } from 'history'
import { Storage } from 'src/libs/storage'
import { VOTE_TYPES } from 'src/utils/DarUtils'

describe('ProgressReportApplication - Component Tests', () => {
  let mockHistory: History

  beforeEach(() => {
    cy.initApplicationConfig()

    // Mock the utility functions that the component uses
    cy.stub(window, 'fetch').resolves({
      ok: true,
      json: () => Promise.resolve([]),
      headers: {
        get: () => 'application/json',
      },
    })

    // Mock Storage methods that might be used
    cy.window().then((win) => {
      win.localStorage.clear()
      win.localStorage.clear()
    })

    cy.stub(Storage, 'getCurrentUser').returns(researcher)

    // Create mock history with stubs inside beforeEach
    mockHistory = {
      action: Action.Pop,
      location: {
        pathname: '/test',
        search: '',
        hash: '',
        state: null,
        key: 'testkey',
      },
      push: cy.stub(),
      replace: cy.stub(),
      go: cy.stub(),
      back: cy.stub(),
      forward: cy.stub(),
      block: cy.stub(),
      listen: cy.stub(),
      createHref: cy.stub(),
    }
  })

  const location: Location = {
    pathname: '/progress-report-application',
    search: '',
    hash: '',
    state: {},
    key: 'testKey',
  }

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
    userId: 1,
  }

  const fso: FileStorageObject = {
    fileStorageObjectId: 1,
    entityId: 'id',
    fileName: 'name',
    category: 'irbCollaborationLetter',
    mediaType: 'image/pdf',
    createUserId: 3,
    createDate: new Date().getDate(),
  }

  const mockDatasets: Dataset[] = [
    {
      datasetId: 1,
      name: 'Test Dataset',
      dacApproval: true,
      dataUse: {
        generalUse: true,
        hmbResearch: false,
        diseaseRestrictions: [],
        populationOriginsAncestry: false,
        methodsResearch: false,
        nonProfitUse: false,
        other: '',
        secondaryOther: '',
        ethicsApprovalRequired: false,
        collaboratorRequired: false,
        geographicalRestrictions: '',
        geneticStudiesOnly: false,
        publicationResults: false,
        publicationMoratorium: '',
        aiLlmUse: false,
        controls: false,
        gender: '',
        pediatric: false,
        population: false,
        illegalBehavior: false,
        sexualDiseases: false,
        stigmatizeDiseases: false,
        vulnerablePopulations: false,
        psychologicalTraits: false,
        notHealth: false,
      },
      datasetName: '',
      createUserId: 0,
      createUser: {
        userId: 0,
        displayName: 'Test Create User',
        email: 'createuser@test.com',
        createDate: new Date('2023-10-01T00:00:00Z'),
        emailPreference: false,
        roles: [],
        userStatusInfo: {
          enabled: true,
          adminEnabled: false,
          userEmail: '',
          userSubjectId: '',
        },
        isAdmin: false,
        isAlumni: false,
        isChairPerson: false,
        isDataSubmitter: false,
        isMember: false,
        isResearcher: false,
        isSigningOfficial: false,
      },
      dacId: 2,
      translatedDataUse: '',
      deletable: false,
      properties: [],
      alias: 2,
      datasetIdentifier: '',
      objectId: '',
      nihCertificationFile: fso,
      study: {
        description: 'Test Dataset Submission',
        studyId: 39,
        piName: 'Test Dataset Submission',
        publicVisibility: true,
        dataTypes: [
          'CITE-seq',
        ],
        name: '',
        datasetIds: [],
        datasets: [],
        properties: [],
        alternativeDataSharingPlan: fso,
        createDate: '',
        createUserId: 0,
        updateDate: '',
        updateUserId: 0,
      },
      createDate: new Date('2023-10-01T00:00:00Z'),
    },
  ]

  const baseDar: Partial<CombinedDataAccessRequest> = {
    userId: 1,
    projectTitle: 'Test Project',
    draft: false,
    datasetIds: [1],
    referenceId: 'DAR-123',
    collectionId: 1,
    elections: {},
    createDate: 1748736000,
    submissionDate: 1748736000,
    updateDate: 1748736000,
  }

  const mountComponent = (dar: Partial<CombinedDataAccessRequest> = {}, readOnly = true) => {
    const fullDar = { ...baseDar, ...dar } as CombinedDataAccessRequest

    const props = {
      dar: fullDar,
      datasets: mockDatasets,
      readOnlyMode: readOnly,
      history: mockHistory,
      location,
      researcher,
      countriesOfOperation: [],
    }

    return mount(<ProgressReportApplication {...props} /> as ReactNode)
  }

  it('renders the component without errors', () => {
    // Mount component with basic DAR
    const basicDar = {}

    mountComponent(basicDar, true)

    // Just check that the component renders by looking for the step container
    cy.get('.accordion-step-container').should('exist')
  })

  it('defaults intellectualPropertyYesNo to false when dar.intellectualProperties is undefined or empty', () => {
    // Test with undefined intellectualProperties
    const darWithoutIntellectualProperty = {}

    mountComponent(darWithoutIntellectualProperty, true)

    // Check that the intellectual property "No" radio button is checked (false state)
    cy.get('#intellectualPropertyYesNo_no').should('be.checked')
    cy.get('#intellectualPropertyYesNo_yes').should('not.be.checked')
  })

  it('defaults intellectualPropertyYesNo to false when dar.intellectualProperties is empty array', () => {
    // Test with empty intellectualProperties array
    const darWithEmptyIntellectualProperty = {
      intellectualProperties: [],
    }

    mountComponent(darWithEmptyIntellectualProperty, true)

    // Check that the intellectual property "No" radio button is checked (false state)
    cy.get('#intellectualPropertyYesNo_no').should('be.checked')
    cy.get('#intellectualPropertyYesNo_yes').should('not.be.checked')
  })

  it('sets intellectualPropertyYesNo to true when dar.intellectualProperties has items', () => {
    // Test with intellectualProperties array containing items
    const darWithIntellectualProperty = {
      intellectualProperties: [{
        ipId: 'ip-1',
        studyId: 'study-1',
        type: 'Patent',
        title: 'IP 1',
        assignee: 'Inventor A',
        patentNumber: 'App123',
        filingDate: '2023-01-01',
        status: 'Filed',
        url: 'https://example.com/ip',
        contact: 'contact@example.com',
        tags: [],
      }, {
        ipId: 'ip-2',
        studyId: 'study-1',
        type: 'Trademark',
        title: 'IP 2',
        assignee: 'Inventor B',
        patentNumber: 'App456',
        filingDate: '2023-02-01',
        status: 'Granted',
        url: 'https://example.com/ip2',
        contact: 'contact2@example.com',
        tags: [],
      }],
    }

    mountComponent(darWithIntellectualProperty, true)

    // Check that the intellectual property "Yes" radio button is checked (true state)
    cy.get('#intellectualPropertyYesNo_yes').should('be.checked')
    cy.get('#intellectualPropertyYesNo_no').should('not.be.checked')

    // Check that intellectual properties are actually displayed in the DOM
    cy.contains('IP 1').should('be.visible')
    cy.contains('IP 2').should('be.visible')
  })

  it('defaults publicationsYesNo to false when dar.publications is undefined or empty', () => {
    // Test with undefined publications
    const darWithoutPublications = {}

    mountComponent(darWithoutPublications, true)

    // Check that the publications "No" radio button is checked (false state)
    cy.get('#publicationsYesNo_no').should('be.checked')
    cy.get('#publicationsYesNo_yes').should('not.be.checked')
  })

  it('defaults publicationsYesNo to false when dar.publications is empty array', () => {
    // Test with empty publications array
    const darWithEmptyPublications = {
      publications: [],
    }

    mountComponent(darWithEmptyPublications, true)

    // Check that the publications "No" radio button is checked (false state)
    cy.get('#publicationsYesNo_no').should('be.checked')
    cy.get('#publicationsYesNo_yes').should('not.be.checked')
  })

  it('sets publicationsYesNo to true when dar.publications has items', () => {
    // Test with publications array containing items
    const darWithPublications = {
      publications: [
        {
          title: 'Publication 1',
          pubmedId: '12345',
          date: '2023-01-01',
          authors: 'Author 1',
          bibliographicCitation: 'Citation 1',
          datasetCitation: 'Dataset Citation 1',
          citation: true,
          link: '',
        },
        {
          title: 'Publication 2',
          pubmedId: '67890',
          date: '2023-02-01',
          authors: 'Author 2',
          bibliographicCitation: 'Citation 2',
          datasetCitation: 'Dataset Citation 2',
          citation: false,
          link: '',
        },
      ],
    } as unknown as CombinedDataAccessRequest

    mountComponent(darWithPublications, true)

    // Check that the publications "Yes" radio button is checked (true state)
    cy.get('#publicationsYesNo_yes').should('be.checked')
    cy.get('#publicationsYesNo_no').should('not.be.checked')

    // Check that publications are actually displayed in the DOM
    cy.contains('Publication 1').should('be.visible')
    cy.contains('Publication 2').should('be.visible')
  })

  it('displays publications in read-only when they exist', () => {
    // Test scenario where publications exist but radio might not be set correctly
    const darWithPublications = {
      publications: [
        {
          title: 'Test Publication',
          pubmedId: '11111',
          date: '2023-03-01',
          authors: 'Test Author',
          bibliographicCitation: 'Test Citation',
          datasetCitation: 'Test Dataset Citation',
          citation: true,
          link: '',
        },
      ],
    } as unknown as CombinedDataAccessRequest

    mountComponent(darWithPublications, true)

    // Publications should be visible regardless of radio button state
    cy.contains('Test Publication').should('be.visible')
  })

  it('defaults presentationsYesNo to false when dar.presentations is undefined', () => {
    const darWithoutPresentations = {}

    mountComponent(darWithoutPresentations, true)

    // Check that the presentations "No" radio button is checked (false state)
    cy.get('#presentationsYesNo_no').should('be.checked')
    cy.get('#presentationsYesNo_yes').should('not.be.checked')
  })

  it('defaults presentationsYesNo to false when dar.presentations is undefined', () => {
    const darWithEmptyPresentations = {}

    mountComponent(darWithEmptyPresentations, true)

    // Check that the presentations "No" radio button is checked (false state)
    cy.get('#presentationsYesNo_no').should('be.checked')
    cy.get('#presentationsYesNo_yes').should('not.be.checked')
  })

  it('sets presentationsYesNo to true when dar.presentations has items', () => {
    const darWithPresentations = {
      presentations: [
        {
          title: 'Presentation 1',
          link: 'http://example.com/presentation1',
          date: '2023-01-01',
          authors: 'Author 1',
          datasetCitation: 'Dataset Citation 1',
          citation: true,
          bibliographicCitation: 'Bibliographic Citation 1',
          pubmedId: '',
        },
        {
          title: 'Presentation 2',
          link: 'http://example.com/presentation2',
          date: '2023-02-01',
          authors: 'Author 2',
          datasetCitation: 'Dataset Citation 2',
          citation: false,
          bibliographicCitation: 'Bibliographic Citation 2',
          pubmedId: '',
        },
      ],
    } as unknown as CombinedDataAccessRequest

    mountComponent(darWithPresentations, true)

    // Check that the presentations "Yes" radio button is checked (true state)
    cy.get('#presentationsYesNo_yes').should('be.checked')
    cy.get('#presentationsYesNo_no').should('not.be.checked')

    // Check that presentations are actually displayed in the DOM
    cy.contains('Presentation 1').should('be.visible')
    cy.contains('Presentation 2').should('be.visible')
  })

  it('does not display IRB document upload when not required by dataUse', () => {
    // mock Datasets included in mount component don't include IRB document requirement
    mountComponent({}, true)
    cy.contains('IRB Documentation').should('not.exist')
  })

  it('displays IRB document upload when required by dataUse', () => {
    // IRB document is required
    mockDatasets[0].dataUse.ethicsApprovalRequired = true
    mountComponent({}, true)

    cy.contains('IRB Documentation').should('be.visible')
  })

  it('defaults dmiYesNo to false when dar.dmi is undefined', () => {
    const darWithoutDmi = {}

    mountComponent(darWithoutDmi, true)

    // Check that the DMI "No" radio button is checked (false state)
    cy.get('#dmiYesNo_no').should('be.checked')
    cy.get('#dmiYesNo_yes').should('not.be.checked')
  })

  it('defaults dmiYesNo to false when dar.dmi.incidents is undefined', () => {
    const darWithEmptyDmiIncidents = {}

    mountComponent(darWithEmptyDmiIncidents, true)

    // Check that the DMI "No" radio button is checked (false state)
    cy.get('#dmiYesNo_no').should('be.checked')
    cy.get('#dmiYesNo_yes').should('not.be.checked')
  })

  it('sets dmiYesNo to true when dar.dmi.incidents has items', () => {
    // Test with dmi incidents array containing realistic incident types
    // These match the FormStateKey enum values that would be generated by getDataManagementIncidents()
    const darWithDmiIncidents = {
      dmi: {
        incidents: ['dmiCombination', 'dmiSharing', 'dmiSecurity'],
        description: 'There were incidents involving inappropriate dataset combination, unauthorized data sharing, and security breaches during the research period.',
      },
    }

    mountComponent(darWithDmiIncidents, true)

    // Check that the DMI "Yes" radio button is checked (true state)
    cy.get('#dmiYesNo_yes').should('be.checked')
    cy.get('#dmiYesNo_no').should('not.be.checked')
  })

  it('defaults closeoutYesNo to false when dar.closeoutSupplement is undefined', () => {
    // Test with undefined closeoutSupplement
    const darWithoutCloseout = {}

    mountComponent(darWithoutCloseout, true)

    // Check that the closeout "No" radio button is checked (false state)
    cy.get('#closeoutYesNo_no').should('be.checked')
    cy.get('#closeoutYesNo_yes').should('not.be.checked')
  })

  it('sets closeoutYesNo to true when closeoutSupplement is in dar and reasons is a non-empty list', () => {
    const darWithCloseout = {
      closeoutSupplement: {
        reasons: ['closeoutProjectCompleted'],
        otherText: '',
        signingOfficialId: 1,
      },
    }

    mountComponent(darWithCloseout, true)

    // Check that the closeout "Yes" radio button is checked (true state)
    cy.get('#closeoutYesNo_yes').should('be.checked')
    cy.get('#closeoutYesNo_no').should('not.be.checked')
  })

  it('displays intellectual properties in read-only mode when they exist', () => {
    const darWithIntellectualProperty = {
      intellectualProperties: [{
        ipId: 'ip-1',
        studyId: 'study-1',
        type: 'Patent',
        title: 'Test IP',
        assignee: 'Inventor A',
        patentNumber: 'App123',
        filingDate: '2023-01-01',
        status: 'Filed',
        url: 'https://example.com/ip',
        contact: 'contact@example.com',
        tags: [],
      }],
    }

    mountComponent(darWithIntellectualProperty, true)

    cy.get('#intellectualPropertyYesNo_yes').should('be.checked')
    cy.get('#intellectualPropertyYesNo_no').should('not.be.checked')

    // Check that IP is visible
    cy.contains('Test IP').should('be.visible')
  })

  it('shows only approved datasets in create-mode progress report', () => {
    // Create multiple datasets with different approval states
    const testDatasets: Dataset[] = [
      {
        ...mockDatasets[0],
        datasetId: 1,
        name: 'Approved Dataset 1',
        datasetName: 'Approved Dataset 1',
        datasetIdentifier: 'DUOS-000001',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 2,
        name: 'Approved Dataset 2',
        datasetName: 'Approved Dataset 2',
        datasetIdentifier: 'DUOS-000002',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 3,
        name: 'Not DAC Approved Dataset',
        datasetName: 'Not DAC Approved Dataset',
        datasetIdentifier: 'DUOS-000003',
        dacApproval: false,
      },
      {
        ...mockDatasets[0],
        datasetId: 4,
        name: 'DAC Approved but Not Election Approved Dataset',
        datasetName: 'DAC Approved but Not Election Approved Dataset',
        datasetIdentifier: 'DUOS-000004',
        dacApproval: true,
      },
    ]

    // Create elections where only datasets 1 and 2 are approved
    const darWithElections = {
      datasetIds: [1, 2, 3, 4], // All datasets are requested in the DAR
      elections: {
        1001: {
          electionId: 1001,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 1,
          votes: {
            10001: {
              voteId: 10001,
              vote: true, // Approved
              userId: 1,
              createDate: 1700000000000,
              electionId: 1001,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        1002: {
          electionId: 1002,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 2,
          votes: {
            10002: {
              voteId: 10002,
              vote: true, // Approved
              userId: 1,
              createDate: 1700000000000,
              electionId: 1002,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        1003: {
          electionId: 1003,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 3,
          votes: {
            10003: {
              voteId: 10003,
              vote: false, // Denied
              userId: 1,
              createDate: 1700000000000,
              electionId: 1003,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        1004: {
          electionId: 1004,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 4,
          votes: {
            10004: {
              voteId: 10004,
              vote: false, // Denied
              userId: 1,
              createDate: 1700000000000,
              electionId: 1004,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
      },
    }

    // Mount component with datasets and elections
    const fullDar = { ...baseDar, ...darWithElections } as unknown as CombinedDataAccessRequest
    const props = {
      dar: fullDar,
      datasets: testDatasets,
      readOnlyMode: false,
      history: mockHistory,
      location,
      researcher,
      countriesOfOperation: [],
    }

    mount(<ProgressReportApplication {...props} /> as ReactNode)

    // Verify that only approved datasets are shown
    // The component should only show datasets that are:
    // 1. In dar.datasetIds
    // 2. Have dacApproval = true
    // 3. Have approved elections (finalAccessVote = true)

    // Should show dataset 1 and 2 (both DAC approved AND election approved)
    cy.get('[data-cy="remove-datasets"]').within(() => {
      cy.contains('Approved Dataset 1').should('exist')
      cy.contains('Approved Dataset 2').should('exist')

      // Should NOT show dataset 3 (not DAC approved)
      cy.contains('Not DAC Approved Dataset').should('not.exist')

      // Should NOT show dataset 4 (DAC approved but election denied)
      cy.contains('DAC Approved but Not Election Approved Dataset').should('not.exist')
    })

    // Verify the count of displayed datasets using the actual CSS class
    cy.get('[data-cy="remove-datasets"] .collaborator-summary-card').should('have.length', 2)
  })

  it('in create-mode, shows no datasets when none are approved through elections', () => {
    // Create datasets where all have DAC approval but none have election approval
    const testDatasets: Dataset[] = [
      {
        ...mockDatasets[0],
        datasetId: 1,
        name: 'DAC Approved Dataset 1',
        datasetName: 'DAC Approved Dataset 1',
        datasetIdentifier: 'DUOS-000001',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 2,
        name: 'DAC Approved Dataset 2',
        datasetName: 'DAC Approved Dataset 2',
        datasetIdentifier: 'DUOS-000002',
        dacApproval: true,
      },
    ]

    // Create elections where all datasets are denied
    const darWithDeniedElections = {
      datasetIds: [1, 2],
      elections: {
        2001: {
          electionId: 2001,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 1,
          votes: {
            20001: {
              voteId: 20001,
              vote: false, // Denied
              userId: 1,
              createDate: 1700000000000,
              electionId: 2001,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        2002: {
          electionId: 2002,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 2,
          votes: {
            20002: {
              voteId: 20002,
              vote: false, // Denied
              userId: 1,
              createDate: 1700000000000,
              electionId: 2002,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
      },
    }

    const fullDar = { ...baseDar, ...darWithDeniedElections } as unknown as CombinedDataAccessRequest
    const props = {
      dar: fullDar,
      datasets: testDatasets,
      readOnlyMode: false,
      history: mockHistory,
      location,
      researcher,
      countriesOfOperation: [],
    }

    mount(<ProgressReportApplication {...props} /> as ReactNode)

    // Should show no datasets since none are approved through elections
    cy.get('[data-cy="remove-datasets"]').within(() => {
      cy.contains('DAC Approved Dataset 1').should('not.exist')
      cy.contains('DAC Approved Dataset 2').should('not.exist')
    })

    // The dataset list should be empty or show a message about no datasets
    cy.get('[data-cy="remove-datasets"] .collaborator-summary-card').should('have.length', 0)
  })

  it('in create-mode, only shows datasets that pass all approval criteria', () => {
    // This test ensures the filtering logic works correctly by testing the exact criteria:
    // 1. Dataset must be in dar.datasetIds
    // 2. Dataset must have dacApproval = true
    // 3. Dataset must have an approved election (type=FINAL, vote=true)

    const testDatasets: Dataset[] = [
      {
        ...mockDatasets[0],
        datasetId: 1,
        name: 'All Criteria Met',
        datasetName: 'All Criteria Met',
        datasetIdentifier: 'DUOS-000001',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 2,
        name: 'Not in DAR datasetIds',
        datasetName: 'Not in DAR datasetIds',
        datasetIdentifier: 'DUOS-000002',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 3,
        name: 'No DAC Approval',
        datasetName: 'No DAC Approval',
        datasetIdentifier: 'DUOS-000003',
        dacApproval: false,
      },
      {
        ...mockDatasets[0],
        datasetId: 4,
        name: 'No Election Approval',
        datasetName: 'No Election Approval',
        datasetIdentifier: 'DUOS-000004',
        dacApproval: true,
      },
    ]

    const darWithFilteringTest = {
      datasetIds: [1, 3, 4], // Note: dataset 2 is NOT included in DAR
      elections: {
        3001: {
          electionId: 3001,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 1,
          votes: {
            30001: {
              voteId: 30001,
              vote: true, // Approved
              userId: 1,
              createDate: 1700000000000,
              electionId: 3001,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        3003: {
          electionId: 3003,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 3,
          votes: {
            30003: {
              voteId: 30003,
              vote: true, // Approved
              userId: 1,
              createDate: 1700000000000,
              electionId: 3003,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        3004: {
          electionId: 3004,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 4,
          votes: {
            30004: {
              voteId: 30004,
              vote: false, // Denied
              userId: 1,
              createDate: 1700000000000,
              electionId: 3004,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
      },
    }

    const fullDar = { ...baseDar, ...darWithFilteringTest } as unknown as CombinedDataAccessRequest
    const props = {
      dar: fullDar,
      datasets: testDatasets,
      readOnlyMode: false,
      history: mockHistory,
      location,
      researcher,
      countriesOfOperation: [],
    }

    mount(<ProgressReportApplication {...props} /> as ReactNode)

    // Only dataset 1 should be shown (meets all criteria)
    cy.get('[data-cy="remove-datasets"]').within(() => {
      cy.contains('All Criteria Met').should('exist')
      cy.contains('Not in DAR datasetIds').should('not.exist')
      cy.contains('No DAC Approval').should('not.exist')
      cy.contains('No Election Approval').should('not.exist')
    })

    cy.get('[data-cy="remove-datasets"] .collaborator-summary-card').should('have.length', 1)
  })

  it('shows only datasets with IDs included in DAR.datasetIds as available datasets (read-only mode)', () => {
    // Create multiple datasets where some are DAC approved but only some are in the DAR datasetIds
    const testDatasets: Dataset[] = [
      {
        ...mockDatasets[0],
        datasetId: 1,
        name: 'Dataset In DAR 1',
        datasetName: 'Dataset In DAR 1',
        datasetIdentifier: 'DUOS-000001',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 2,
        name: 'Dataset In DAR 2',
        datasetName: 'Dataset In DAR 2',
        datasetIdentifier: 'DUOS-000002',
        dacApproval: true,
      },
      {
        ...mockDatasets[0],
        datasetId: 3,
        name: 'Dataset NOT In DAR',
        datasetName: 'Dataset NOT In DAR',
        datasetIdentifier: 'DUOS-000003',
        dacApproval: true, // DAC approved but NOT in DAR datasetIds
      },
      {
        ...mockDatasets[0],
        datasetId: 4,
        name: 'Another Dataset NOT In DAR',
        datasetName: 'Another Dataset NOT In DAR',
        datasetIdentifier: 'DUOS-000004',
        dacApproval: true, // DAC approved but NOT in DAR datasetIds
      },
    ]

    // Create elections where all datasets are approved (to isolate the datasetIds filtering)
    const darWithSelectiveDatasetIds = {
      datasetIds: [1, 2], // Only datasets 1 and 2 are in the DAR request
      elections: {
        1001: {
          electionId: 1001,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 1,
          votes: {
            10001: {
              voteId: 10001,
              vote: true, // Approved
              userId: 1,
              createDate: 1700000000000,
              electionId: 1001,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 1',
            },
          },
        },
        1002: {
          electionId: 1002,
          electionType: 'DataAccess',
          status: 'Closed',
          createDate: 1700000000000,
          referenceId: 'DAR-123',
          datasetId: 2,
          votes: {
            10002: {
              voteId: 10002,
              vote: true, // Approved
              userId: 1,
              createDate: 1700000000000,
              electionId: 1002,
              type: VOTE_TYPES.FINAL,
              displayName: 'Test Voter 2',
            },
          },
        },
        // Note: No elections for datasets 3 and 4 since they're not in the DAR
      },
    }

    const fullDar = { ...baseDar, ...darWithSelectiveDatasetIds } as unknown as CombinedDataAccessRequest

    const props = {
      dar: fullDar,
      datasets: testDatasets,
      readOnlyMode: true, // Testing in read-only mode
      history: mockHistory,
      location,
      researcher,
      countriesOfOperation: [],
    }

    mount(<ProgressReportApplication {...props} /> as ReactNode)

    cy.get('[data-cy="remove-datasets"]').should('exist')

    // Should show only datasets 1 and 2 (which are in dar.datasetIds)
    cy.get('[data-cy="remove-datasets"]').within(() => {
      cy.contains('Dataset In DAR 1').should('exist')
      cy.contains('Dataset In DAR 2').should('exist')

      // Should NOT show datasets 3 and 4 (not in dar.datasetIds, even though they have DAC approval)
      cy.contains('Dataset NOT In DAR').should('not.exist')
      cy.contains('Another Dataset NOT In DAR').should('not.exist')
    })

    // Verify exactly 2 datasets are displayed (only those in dar.datasetIds)
    cy.get('[data-cy="remove-datasets"] .collaborator-summary-card').should('have.length', 2)

    // In read-only mode, verify that the datasets are displayed but not editable
    cy.get('[data-cy="remove-datasets"] .collaborator-summary-card').each(($card) => {
      // Should not have remove buttons or other interactive elements in read-only mode
      cy.wrap($card).find('button').should('not.exist')
      cy.wrap($card).find('input[type="checkbox"]').should('not.exist')
    })
  })
})
