import { Collections } from 'src/libs/ajax/Collections'
import { Config } from 'src/libs/config'
import type { DarCollection, DarCollectionSummary, UserRoleName } from 'src/types/model'

describe('Collections ajax', () => {
  const apiUrl = 'https://api.example.test'
  const roleName: UserRoleName = 'Researcher'

  // Sanitized mock data — no real names, emails, or institution identifiers
  const mockCollection: DarCollection = {
    id: 1,
    darCode: 'DAR-0001',
    createDate: 1700000000000,
    createUserId: 10,
    dars: {} as Record<string, never>,
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

      cy.wrap(Collections.cancelCollection(1, roleName)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@cancel').then((interception) => {
        cy.wrap(interception.request.url).should('include', 'roleName=Researcher')
        cy.wrap(interception.request.headers['content-type']).should('include', 'application/json')
        cy.wrap(interception.request.headers['authorization']).should('exist')
      })
    })

    it('throws on a non-200 response', () => {
      cy.intercept('PUT', `${apiUrl}/api/collections/1/cancel*`, {
        statusCode: 500,
        body: { message: 'Internal Server Error' },
        headers: { 'content-type': 'application/json' },
      })

      cy.wrap(
        Collections.cancelCollection(1, roleName).catch(e => e),
      ).its('message').should('include', 'Internal Server Error')
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

      cy.wait('@resubmit').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/api/collections/1/resubmit')
        cy.wrap(interception.request.headers['authorization']).should('exist')
        cy.wrap(interception.request.headers['content-type']).should('include', 'application/json')
      })
    })

    it('throws on a 404 response', () => {
      cy.intercept('PUT', `${apiUrl}/api/collections/1/resubmit`, {
        statusCode: 404,
        body: { message: 'Not Found' },
        headers: { 'content-type': 'application/json' },
      })

      cy.wrap(
        Collections.reviseCollection(1).catch(e => e),
      ).its('message').should('include', 'Not Found')
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

      cy.wait('@getCollection').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/api/collections/1')
        cy.wrap(interception.request.headers['authorization']).should('exist')
      })
    })

    it('throws on a 403 response', () => {
      cy.intercept('GET', `${apiUrl}/api/collections/1`, {
        statusCode: 403,
        body: { message: 'Forbidden' },
        headers: { 'content-type': 'application/json' },
      })

      cy.wrap(
        Collections.getCollectionById(1).catch(e => e),
      ).its('message').should('include', 'Forbidden')
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

      cy.wait('@electionHistory').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/api/collections/1/electionHistory')
        cy.wrap(interception.request.headers['authorization']).should('exist')
      })
    })

    it('throws on a 500 response', () => {
      cy.intercept('GET', `${apiUrl}/api/collections/1/electionHistory`, {
        statusCode: 500,
        body: { message: 'Server Error' },
        headers: { 'content-type': 'application/json' },
      })

      cy.wrap(
        Collections.getCollectionByIdWithElectionHistory(1).catch(e => e),
      ).its('message').should('include', 'Server Error')
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

      cy.wrap(Collections.getCollectionSummariesByRoleName(roleName)).should(
        'deep.equal',
        mockSummaries,
      )

      cy.wait('@summaries').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/role/Researcher/summary')
        cy.wrap(interception.request.headers['authorization']).should('exist')
      })
    })

    it('returns an empty array when the server returns []', () => {
      cy.intercept(
        'GET',
        `${apiUrl}/api/collections/role/Researcher/summary`,
        { statusCode: 200, body: [] },
      )

      cy.wrap(Collections.getCollectionSummariesByRoleName(roleName)).should(
        'deep.equal',
        [],
      )
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
          roleName,
          id: 1,
        }),
      ).should('deep.equal', mockSummary)

      cy.wait('@summaryById').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/role/Researcher/summary/1')
        cy.wrap(interception.request.headers['authorization']).should('exist')
      })
    })

    it('throws on a 404 response', () => {
      cy.intercept(
        'GET',
        `${apiUrl}/api/collections/role/Researcher/summary/1`,
        {
          statusCode: 404,
          body: { message: 'Not Found' },
          headers: { 'content-type': 'application/json' },
        },
      )

      cy.wrap(
        Collections.getCollectionSummaryByRoleNameAndId({ roleName, id: 1 }).catch(e => e),
      ).its('message').should('include', 'Not Found')
    })
  })

  describe('openElectionsById', () => {
    it('sends a POST request to the election endpoint with empty body', () => {
      cy.intercept('POST', `${apiUrl}/api/collections/1/election`, {
        statusCode: 200,
        body: mockCollection,
      }).as('openElections')

      cy.wrap(Collections.openElectionsById(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@openElections').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/api/collections/1/election')
        cy.wrap(interception.request.headers['authorization']).should('exist')
        cy.wrap(interception.request.headers['content-type']).should('include', 'application/json')
        cy.wrap(interception.request.body).should('deep.equal', {})
      })
    })

    it('throws on a 500 response', () => {
      cy.intercept('POST', `${apiUrl}/api/collections/1/election`, {
        statusCode: 500,
        body: { message: 'Internal Server Error' },
        headers: { 'content-type': 'application/json' },
      })

      cy.wrap(
        Collections.openElectionsById(1).catch(e => e),
      ).its('message').should('include', 'Internal Server Error')
    })
  })

  describe('approveCollectionById', () => {
    it('sends a POST request to the approve endpoint with empty body', () => {
      cy.intercept('POST', `${apiUrl}/api/collections/1/approve`, {
        statusCode: 200,
        body: mockCollection,
      }).as('approve')

      cy.wrap(Collections.approveCollectionById(1)).should(
        'deep.equal',
        mockCollection,
      )

      cy.wait('@approve').then((interception) => {
        cy.wrap(interception.request.url).should('include', '/api/collections/1/approve')
        cy.wrap(interception.request.headers['authorization']).should('exist')
        cy.wrap(interception.request.headers['content-type']).should('include', 'application/json')
        cy.wrap(interception.request.body).should('deep.equal', {})
      })
    })

    it('throws on a 403 response', () => {
      cy.intercept('POST', `${apiUrl}/api/collections/1/approve`, {
        statusCode: 403,
        body: { message: 'Forbidden' },
        headers: { 'content-type': 'application/json' },
      })

      cy.wrap(
        Collections.approveCollectionById(1).catch(e => e),
      ).its('message').should('include', 'Forbidden')
    })
  })
})
