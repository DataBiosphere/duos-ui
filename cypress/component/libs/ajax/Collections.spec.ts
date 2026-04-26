import { Collections } from 'src/libs/ajax/Collections'
import { Config } from 'src/libs/config'
import type { DarCollection, DarCollectionSummary } from 'src/types/model'

describe('Collections ajax', () => {
  const apiUrl = 'https://api.example.test'

  // Sanitized mock data — no real names, emails, or institution identifiers
  const mockCollection: DarCollection = {
    id: 1,
    darCode: 'DAR-0001',
    createDate: 1700000000000,
    createUserId: 10,
    dars: {},
    datasets: [],
  }

  const mockSummary: DarCollectionSummary = {
    actions: ['cancel', 'revise'],
    dacNames: ['Test DAC'],
    dacCode: 'DAC-0001',
    darCode: 'DAR-0001',
    darCollectionId: 1,
    datasetCount: 2,
    datasetIds: [101, 102],
    expired: false,
    expiresAt: 1900000000000,
    institutionName: 'Test Institution',
    latestReferenceId: 'ref-0001',
    name: 'Test Project',
    progressReport: false,
    referenceIds: ['ref-0001', 'ref-0002'],
    requiresSOApproval: false,
    researcherName: 'Test Researcher',
    status: 'In Progress',
    submissionDate: 1700000000000,
  }

  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(apiUrl)
    cy.stub(Config, 'authOpts').returns({
      headers: { Authorization: 'Bearer test-token' },
    })
  })

  describe('cancelCollection', () => {
    it('sends a PUT request to the cancel endpoint with roleName param', () => {
      cy.intercept('PUT', `${apiUrl}/api/collections/1/cancel*`, {
        statusCode: 200,
        body: mockCollection,
      }).as('cancel')

      cy.wrap(Collections.cancelCollection(1, 'Researcher')).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@cancel').its('request').should((req) => {
        expect(req.url).to.include('roleName=Researcher')
      })
    })
  })

  describe('reviseCollection', () => {
    it('sends a PUT request to the resubmit endpoint', () => {
      cy.intercept('PUT', `${apiUrl}/api/collections/1/resubmit`, {
        statusCode: 200,
        body: mockCollection,
      }).as('resubmit')

      cy.wrap(Collections.reviseCollection(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@resubmit')
        .its('request.headers.authorization')
        .should('exist')
    })
  })

  describe('getCollectionById', () => {
    it('sends a GET request and returns the collection', () => {
      cy.intercept('GET', `${apiUrl}/api/collections/1`, {
        statusCode: 200,
        body: mockCollection,
      }).as('getCollection')

      cy.wrap(Collections.getCollectionById(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@getCollection')
        .its('request.headers.authorization')
        .should('exist')
    })
  })

  describe('getCollectionByIdWithElectionHistory', () => {
    it('sends a GET request to the electionHistory endpoint', () => {
      cy.intercept('GET', `${apiUrl}/api/collections/1/electionHistory`, {
        statusCode: 200,
        body: mockCollection,
      }).as('electionHistory')

      cy.wrap(Collections.getCollectionByIdWithElectionHistory(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@electionHistory')
        .its('request.headers.authorization')
        .should('exist')
    })
  })

  describe('getCollectionSummariesByRoleName', () => {
    it('sends a GET request and returns an array of summaries', () => {
      const mockSummaries: DarCollectionSummary[] = [mockSummary]

      cy.intercept(
        'GET',
        `${apiUrl}/api/collections/role/Researcher/summary`,
        {
          statusCode: 200,
          body: mockSummaries,
        },
      ).as('summaries')

      cy.wrap(Collections.getCollectionSummariesByRoleName('Researcher')).should(
        'deep.equal',
        mockSummaries,
      )

      cy.wait('@summaries')
        .its('request.url')
        .should('include', '/role/Researcher/summary')
    })
  })

  describe('getCollectionSummaryByRoleNameAndId', () => {
    it('sends a GET request with roleName and id in the path', () => {
      cy.intercept(
        'GET',
        `${apiUrl}/api/collections/role/Researcher/summary/1`,
        {
          statusCode: 200,
          body: mockSummary,
        },
      ).as('summaryById')

      cy.wrap(
        Collections.getCollectionSummaryByRoleNameAndId({
          roleName: 'Researcher',
          id: 1,
        }),
      ).should('deep.equal', mockSummary)

      cy.wait('@summaryById')
        .its('request.url')
        .should('include', '/role/Researcher/summary/1')
    })
  })

  describe('openElectionsById', () => {
    it('sends a POST request to the election endpoint', () => {
      cy.intercept('POST', `${apiUrl}/api/collections/1/election`, {
        statusCode: 200,
        body: mockCollection,
      }).as('openElections')

      cy.wrap(Collections.openElectionsById(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@openElections')
        .its('request.headers.authorization')
        .should('exist')
    })
  })

  describe('approveCollectionById', () => {
    it('sends a POST request to the approve endpoint', () => {
      cy.intercept('POST', `${apiUrl}/api/collections/1/approve`, {
        statusCode: 200,
        body: mockCollection,
      }).as('approve')

      cy.wrap(Collections.approveCollectionById(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@approve')
        .its('request.headers.authorization')
        .should('exist')
    })
  })
})
