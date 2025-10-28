/* eslint-disable cypress/no-assigning-return-values */
import { React } from 'react'
import { mount } from 'cypress/react'
import DarCollectionReview from 'src/pages/dar_collection_review/DarCollectionReview'
import { Collections } from 'src/libs/ajax/Collections'
import { Match } from 'src/libs/ajax/Match'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { Navigation } from 'src/libs/utils'
import { OntologyService } from 'src/libs/ontologyService'
import { DataSet } from 'src/libs/ajax/DataSet'
import { VOTE_TYPES } from 'src/utils/DarUtils.js'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'

const dar = {
  darCollectionId: 777,
  darCode: 'DAR-XXX',
  createDate: 1669229413840,
  createUser: {
    userId: 7,
    email: 'Bob.Jones@prodigy.com',
    displayName: 'Bob Jones',
    createDate: 1668229413840,
    roles: null,
    properties: [
      {
        propertyId: 19000,
        userId: 7,
        propertyKey: 'suggestedInstitution',
        propertyValue: '',
      },
      {
        propertyId: 18999,
        userId: 7,
        propertyKey: 'suggestedSigningOfficial',
        propertyValue: '',
      },
      {
        propertyId: 18998,
        userId: 7,
        propertyKey: 'selectedSigningOfficialId',
        propertyValue: '5555',
      },
      {
        propertyId: 18995,
        userId: 7,
        propertyKey: 'eraExpiration',
        propertyValue: '1670117014385',
      },
      {
        propertyId: 18994,
        userId: 7,
        propertyKey: 'eraAuthorized',
        propertyValue: 'true',
      },
      {
        propertyId: 17158,
        userId: 7,
        propertyKey: 'scientificURL',
        propertyValue: '',
      },
      {
        propertyId: 17157,
        userId: 7,
        propertyKey: 'isThePI',
        propertyValue: 'true',
      },
      {
        propertyId: 17156,
        userId: 7,
        propertyKey: 'department',
        propertyValue: 'TPS',
      },
      {
        propertyId: 17155,
        userId: 7,
        propertyKey: 'checkNotifications',
        propertyValue: 'true',
      },
      {
        propertyId: 17154,
        userId: 7,
        propertyKey: 'state',
        propertyValue: 'CA',
      },
      {
        propertyId: 17153,
        userId: 7,
        propertyKey: 'researcherGate',
        propertyValue: '',
      },
      {
        propertyId: 17152,
        userId: 7,
        propertyKey: 'piERACommonsID',
        propertyValue: '',
      },
      {
        propertyId: 17151,
        userId: 7,
        propertyKey: 'academicEmail',
        propertyValue: 'Bob.Jones@prodigy.com',
      },
      {
        propertyId: 17150,
        userId: 7,
        propertyKey: 'zipcode',
        propertyValue: '90210',
      },
      {
        propertyId: 17149,
        userId: 7,
        propertyKey: 'division',
        propertyValue: '',
      },
      {
        propertyId: 17867,
        userId: 7,
        propertyKey: 'piName',
        propertyValue: 'Bob Jones',
      },
      {
        propertyId: 17147,
        userId: 7,
        propertyKey: 'pubmedID',
        propertyValue: '',
      },
      {
        propertyId: 17146,
        userId: 7,
        propertyKey: 'linkedIn',
        propertyValue: '',
      },
      {
        propertyId: 17145,
        userId: 7,
        propertyKey: 'completed',
        propertyValue: 'true',
      },
      {
        propertyId: 17144,
        userId: 7,
        propertyKey: 'orcid',
        propertyValue: '',
      },
      {
        propertyId: 17143,
        userId: 7,
        propertyKey: 'havePI',
        propertyValue: '',
      },
      {
        propertyId: 17142,
        userId: 7,
        propertyKey: 'address1',
        propertyValue: '1313 Mockingbird Lane',
      },
      {
        propertyId: 17141,
        userId: 7,
        propertyKey: 'piEmail',
        propertyValue: 'Bob.Jones@prodigy.com',
      },
      {
        propertyId: 17140,
        userId: 7,
        propertyKey: 'city',
        propertyValue: 'Mockingbird Heights',
      },
      {
        propertyId: 17139,
        userId: 7,
        propertyKey: 'address2',
        propertyValue: '',
      },
      {
        propertyId: 17138,
        userId: 7,
        propertyKey: 'country',
        propertyValue: 'USA',
      },
    ],
    emailPreference: true,
    institutionId: 90210,
    eraCommonsId: 'HERMAN',
    institution: {
      id: 90210,
      name: 'Ace Industries',
      itDirectorName: null,
      itDirectorEmail: null,
      signingOfficials: null,
      institutionUrl: null,
      dunsNumber: null,
      orgChartUrl: null,
      verificationUrl: null,
      verificationFilename: null,
      organizationType: null,
      createDate: 1626700443000,
      createUserId: null,
      updateDate: null,
      updateUserId: null,
      createUser: null,
      updateUser: null,
    },
    libraryCard: {
      id: 182,
      userId: 7,
      institutionId: 90210,
      eraCommonsId: null,
      userName: 'Bob Jones',
      userEmail: 'Bob.Jones@prodigy.com',
      createDate: 1667817915000,
      createUserId: 5555,
      updateDate: null,
      updateUserId: null,
      institution: null,
    },
  },
  createUserId: 7,
  updateDate: null,
  updateUserId: null,
  dars: {
    'dars-id-123': {
      id: 2147,
      referenceId: 'dars-id-123',
      collectionId: 777,
      data: {
        institution: 'Ace Industries',
        projectTitle: 'Collection of sleep apnea samples',
        researcher: 'Bob Jones',
        rus: 'One good RUS\n',
        nonTechRus: 'One non-technical RUS\n',
        diseases: true,
        methods: true,
        aiLlmUse: false,
        other: false,
        ontologies: [
          {
            id: 'https://purl.obolibrary.org/obo/DOID_8577',
            label: 'sleep apnea',
            definition: null,
            synonyms: null,
          },
        ],
        forProfit: false,
        oneGender: false,
        pediatric: false,
        illegalBehavior: false,
        addiction: false,
        sexualDiseases: false,
        stigmatizedDiseases: false,
        vulnerablePopulation: false,
        populationMigration: false,
        psychiatricTraits: false,
        notHealth: false,
        hmb: false,
        poa: false,
        datasets: [
          {
            key: '867',
            value: '867',
            label: 'Sleep Apnea',
          },
        ],
        darCode: 'DAR-XXX',
        createDate: 1667971415440,
        sortDate: 1667971415440,
        datasetIds: [
          13,
        ],
        datasetDetail: [],
        anvilUse: false,
        localUse: true,
        itDirector: 'Jared Dunn',
        signingOfficial: 'Alice Smith (Alice.Smith@prodigy.com)',
        labCollaborators: [],
        internalCollaborators: [
          {
            approverStatus: null,
            email: 'homer.simpson@aol.com',
            eraCommonsId: 'HOMER-SIMPSON-4',
            name: 'Homer Simpson',
            title: 'Researcher',
            uuid: 'researcher-2',
          },
        ],
        externalCollaborators: [],
        pubAcknowledgement: false,
        dsacknowledgement: false,
        gsoacknowledgement: false,
      },
      draft: false,
      userId: 7,
      createDate: 1667970929000,
      sortDate: 1669229413840,
      submissionDate: 1669229413840,
      updateDate: 1669229413840,
      elections: {
        8888: {
          electionId: 8888,
          electionType: 'DataAccess',
          status: 'Open',
          createDate: 1669062648000,
          referenceId: 'dars-id-123',
          datasetId: 13,
          votes: {
            8675: {
              voteId: 8675,
              vote: true,
              userId: 4444,
              createDate: 1669062648000,
              updateDate: 1669120753000,
              electionId: 8888,
              rationale: '',
              type: 'DAC',
              displayName: 'Beth Johnson',
            },
            8676: {
              voteId: 8676,
              userId: 11111,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'DAC',
              displayName: 'Ted Lasso',
            },
            8677: {
              voteId: 8677,
              userId: 11111,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'Chairperson',
              displayName: 'Ted Lasso',
            },
            8678: {
              voteId: 8678,
              userId: 11111,
              createDate: 1669062648000,
              electionId: 8888,
              type: VOTE_TYPES.FINAL,
              displayName: 'Ted Lasso',
            },
            8679: {
              voteId: 8679,
              userId: 11111,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'AGREEMENT',
              displayName: 'Ted Lasso',
            },
            8680: {
              voteId: 8680,
              userId: 9988,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'DAC',
              displayName: 'Stuart Williams',
            },
            8681: {
              voteId: 8681,
              userId: 9988,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'Chairperson',
              displayName: 'Stuart Williams',
            },
            8682: {
              voteId: 8682,
              userId: 9988,
              createDate: 1669062648000,
              electionId: 8888,
              type: VOTE_TYPES.FINAL,
              displayName: 'Stuart Williams',
            },
            8683: {
              voteId: 8683,
              userId: 9988,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'AGREEMENT',
              displayName: 'Stuart Williams',
            },
            8684: {
              voteId: 8684,
              userId: 4585,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'DAC',
              displayName: 'Sue Smtih',
            },
            8674: {
              voteId: 8685,
              userId: 33333,
              createDate: 1669062648000,
              electionId: 8888,
              type: 'DAC',
              displayName: 'DAC Member1',
            },
          },
        },
        1776: {
          electionId: 1776,
          electionType: 'RP',
          status: 'Open',
          createDate: 1669062648000,
          referenceId: 'dars-id-123',
          datasetId: 13,
          votes: {
            8688: {
              voteId: 8688,
              userId: 9988,
              createDate: 1669062648000,
              electionId: 1776,
              type: 'DAC',
              displayName: 'Stuart Williams',
            },
            8689: {
              voteId: 8689,
              userId: 9988,
              createDate: 1669062648000,
              electionId: 1776,
              type: 'Chairperson',
              displayName: 'Stuart Williams',
            },
            8690: {
              voteId: 8690,
              userId: 4585,
              createDate: 1669062648000,
              electionId: 1776,
              type: 'DAC',
              displayName: 'Sue Smtih',
            },
            8685: {
              voteId: 8685,
              userId: 4444,
              createDate: 1669062648000,
              electionId: 1776,
              type: 'DAC',
              displayName: 'Beth Johnson',
            },
            8686: {
              voteId: 8686,
              userId: 11111,
              createDate: 1669062648000,
              electionId: 1776,
              type: 'DAC',
              displayName: 'Ted Lasso',
            },
            8687: {
              voteId: 8687,
              userId: 11111,
              createDate: 1669062648000,
              electionId: 1776,
              type: 'Chairperson',
              displayName: 'Ted Lasso',
            },
          },
        },
      },
      datasetIds: [
        13,
      ],
    },
  },
  datasets: [
    {
      datasetId: 13,
      objectId: null,
      name: 'Sleep Apnea',
      datasetName: 'Sleep Apnea',
      createDate: 1567123200000,
      createUserId: null,
      updateDate: 1643730658770,
      updateUserId: 11111,
      consentName: null,
      alias: 999,
      datasetIdentifier: 'DUOS-00999',
      dataUse: {
        diseaseRestrictions: [
          'https://purl.obolibrary.org/obo/DOID_0050847',
        ],
        populationOriginsAncestry: true,
        controlSetOption: 'Yes',
      },
      dacId: 1,
      consentId: 'B177D3C2-CDD8-4153-9CBF-AE4F0C34609A',
      translatedDataUse: 'Samples are restricted for use under the following conditions:\nData use is limited for studying: sleep apnea [DS]\nFuture use for population origins or ancestry research is prohibited. [POA]\nCommercial use is not prohibited.\nData use for methods development research irrespective of the specified data use limitations is not prohibited.\nFuture use as a control set for diseases other than those specified is prohibited. [NCTRL]',
      deletable: false,
      sharingPlanDocument: null,
      sharingPlanDocumentName: null,
      properties: [
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: '# of participants',
          propertyValue: 17,
          createDate: null,
          schemaProperty: null,
          propertyType: 'Number',
          propertyTypeAsString: 'number',
          propertyValueAsString: '17',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'Dataset Name',
          propertyValue: 'Sleep Apnea',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'Sleep Apnea',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'Description',
          propertyValue: 'Single cell RNA-sequence',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'Single cell RNA-sequence',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'Data Type',
          propertyValue: 'RNA-seq',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'RNA-seq',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'Data Depositor',
          propertyValue: 'data_depositor@example.com',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'data_depositor@example.com',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'Species',
          propertyValue: 'Human',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'Human',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'Phenotype/Indication',
          propertyValue: 'sleep apnea',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'sleep apnea',
        },
        {
          propertyId: null,
          datasetId: 13,
          propertyKey: null,
          propertyName: 'url',
          propertyValue: 'https://example.com',
          createDate: null,
          schemaProperty: null,
          propertyType: 'String',
          propertyTypeAsString: 'string',
          propertyValueAsString: 'https://example.com',
        },
      ],
      dacApproval: true,
      study: {
        piName: 'Lisa Simpson, Betty White',
      },
    },
  ],
}

const props = {
  adminPage: false,
  isLogged: true,
  env: 'local',
}

const chair = {
  userId: 11111,
  displayName: 'Ted Lasso',
  roles: [
    {
      dacId: 1,
      userRoleId: 586,
      userId: 11111,
      roleId: 2,
      name: 'Chairperson',
    },
  ],
}

const admin = {
  userId: 22222,
  displayName: 'Admin1',
  roles: [
    {
      userRoleId: 587,
      userId: 22222,
      roleId: 4,
      name: 'Admin',
    },
  ],
}

const member = {
  userId: 33333,
  displayName: 'DAC Member1',
  roles: [
    {
      dacId: 1,
      userRoleId: 588,
      userId: 33333,
      roleId: 1,
      name: 'Member',
    },
  ],
}

const researcher = {
  userId: 7,
  email: 'Bob.Jones@prodigy.com',
  displayName: 'Bob Jones',
  createDate: 1668229413840,
  roles: null,
}

const ontologyResponse = [
]

const matchResponse = [
  {
    id: 911,
    consent: 'DUOS-00099',
    purpose: 'dars-id-123',
    match: true,
    failed: false,
    abstain: false,
    createDate: 1668729600000,
    algorithmVersion: 'v2',
    rationales: [],
  },
]

const dacDatasets = [{
  datasetName: null,
  dacId: 3,
  datasetId: 13,
  consentId: 'B177D3C2-CDD8-4153-9CBF-AE4F0C34609A',
  translatedDataUse: '',
  deletable: null,
  properties: [
    {
      propertyName: 'Dataset Name',
      propertyValue: 'Sleep Apnea',
    },
  ],
  isAssociatedToDataOwners: null,
  updateAssociationToDataOwnerAllowed: null,
  alias: 999,
  datasetIdentifier: 'DUOS-000999',
  objectId: null,
  createDate: 1648512000000,
  createUserId: 5052,
  updateDate: 1648590021870,
  updateUserId: 5052,
  dataUse: {
    generalUse: true,
  },
}]

const terms = [{
  datasetId: 13,
  objectId: null,
  name: 'Sleep Apnea',
  datasetName: 'Sleep Apnea',
  datasetIdentifier: 'DUOS-00999',
  dataUse: {
    primary: [{
      code: 'POA',
      description: 'POA',
    }],
  },
  dacId: 1,
}]

beforeEach(() => {
  cy.stub(Collections, 'getCollectionById').returns(dar)
  cy.stub(Collections, 'getCollectionByIdWithElectionHistory').returns(dar)
  cy.stub(User, 'getById').returns(researcher)
  cy.stub(Navigation, 'console').returns({})
  cy.stub(OntologyService, 'searchOntology').returns(ontologyResponse)
  cy.stub(Match, 'findMatchBatch').returns(matchResponse)
  cy.stub(User, 'getUserRelevantDatasets').returns(dacDatasets)
  cy.stub(DataSet, 'searchDatasetIndex').returns(terms)
})

describe('DAR Review', () => {
  it('renders the collections-review-page div with tabs for Chairs', () => {
    cy.stub(Storage, 'getCurrentUser').returns(chair)
    mount(<BrowserRouter><DarCollectionReview {...props} /></BrowserRouter>)
    const voteHistoryTab = cy.get('.collection-review-page').find('.tab-selection-Voting')
    const applicationTab = cy.get('.collection-review-page').find('.tab-selection-Application')
    const fullDarTab = cy.get('.collection-review-page').find('.tab-selection-Full')
    const chairContainer = cy.get('.collection-review-page').find('.tab-selection-Chair')
    const memberContainer = cy.get('.collection-review-page').find('.tab-selection-Member')

    voteHistoryTab.should('exist').should('be.visible')
    applicationTab.should('exist').should('be.visible')
    fullDarTab.should('exist').should('be.visible')
    chairContainer.should('exist').should('be.visible')
    memberContainer.should('exist').should('be.visible')
    cy.get('[data-cy=dataset-list]').should('not.exist')

    chairContainer.click().then(() => {
      cy.get('[data-cy=dataset-list]').should('exist').should('be.visible').contains('Sleep Apnea')
    })
    memberContainer.click().then(() => {
      cy.get('[data-cy=dataset-list]').should('exist').should('be.visible').contains('Sleep Apnea')
    })
  })

  it('renders the collections-review-page div with tabs for Members', () => {
    cy.stub(Storage, 'getCurrentUser').returns(member)
    mount(<BrowserRouter><DarCollectionReview {...props} /></BrowserRouter>)

    cy.get('.tab-selection-Chair').should('not.exist')

    const voteHistoryTab = cy.get('.collection-review-page').find('.tab-selection-Voting')
    const applicationTab = cy.get('.collection-review-page').find('.tab-selection-Application')
    const fullDarTab = cy.get('.collection-review-page').find('.tab-selection-Full')
    const memberContainer = cy.get('.collection-review-page').find('.tab-selection-Member')

    voteHistoryTab.should('exist').should('be.visible')
    applicationTab.should('exist').should('be.visible')
    fullDarTab.should('exist').should('be.visible')
    memberContainer.should('exist').should('be.visible')
    cy.get('[data-cy=dataset-list]').should('not.exist')

    memberContainer.click().then(() => {
      cy.get('[data-cy=dataset-list]').should('exist').should('be.visible').contains('Sleep Apnea')
    })
  })

  it('renders the collections-review-page div with tabs for Researchers', () => {
    cy.stub(Storage, 'getCurrentUser').returns(researcher)
    mount(
      <MemoryRouter initialEntries={['/dar_collection/777']}>
        <Routes>
          <Route path="/dar_collection/:collectionId" element={<DarCollectionReview {...props} />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('.tab-selection-Voting').should('not.exist')
    cy.get('.tab-selection-Chair').should('not.exist')
    cy.get('.tab-selection-Member').should('not.exist')

    const applicationTab = cy.get('.collection-review-page').find('.tab-selection-Application')
    const fullDarTab = cy.get('.collection-review-page').find('.tab-selection-Full')

    applicationTab.should('exist').should('be.visible')
    fullDarTab.should('exist').should('be.visible')
  })

  it('renders the collections-review-page div with tabs for Admins', () => {
    cy.stub(Storage, 'getCurrentUser').returns(admin)
    const propsCopy = Object.assign({}, props, { adminPage: true })
    mount(
      <MemoryRouter initialEntries={['/dar_collection/777']}>
        <Routes>
          <Route path="/dar_collection/:collectionId" element={<DarCollectionReview {...propsCopy} />} />
        </Routes>
      </MemoryRouter>,
    )

    cy.get('.tab-selection-Member').should('not.exist')

    const voteHistoryTab = cy.get('.collection-review-page').find('.tab-selection-Voting')
    const applicationTab = cy.get('.collection-review-page').find('.tab-selection-Application')
    const fullDarTab = cy.get('.collection-review-page').find('.tab-selection-Full')
    const chairContainer = cy.get('.collection-review-page').find('.tab-selection-Chair')

    voteHistoryTab.should('exist').should('be.visible')
    applicationTab.should('exist').should('be.visible')
    fullDarTab.should('exist').should('be.visible')
    chairContainer.should('exist').should('be.visible')
  })
})
