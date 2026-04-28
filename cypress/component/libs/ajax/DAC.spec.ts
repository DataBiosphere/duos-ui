import { DAC } from 'src/libs/ajax/DAC'
import { Config } from 'src/libs/config'
import type { DacObject, Dataset, DuosUser } from 'src/types/model'

type MockDACbotRule = {
  id: number
  ruleType: string
  description: string
  ruleState: 'AVAILABLE' | 'DEPRECATED' | 'UNAVAILABLE'
  activationDate: number
  enabledByUserId: number | null
  displayName: string | null
  userEmail: string | null
}

describe('DAC ajax', () => {
  const apiUrl = 'https://api.example.test'
  const authHeaders = {
    'Authorization': 'Bearer test-token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  }

  const mockDac: DacObject = {
    dacId: 42,
    name: 'Test DAC',
    description: 'Test DAC description',
    email: 'dac@example.test',
    chairpersons: [],
    members: [],
  }

  const mockDataset: Dataset = {
    name: 'Dataset Alpha',
    datasetId: 101,
    createUserId: 1001,
    createUser: {
      createDate: '2024-01-01T00:00:00.000Z' as unknown as Date,
      displayName: 'Dataset Owner',
      email: 'owner@example.test',
      emailPreference: true,
      isAdmin: false,
      isAlumni: false,
      isChairPerson: false,
      isDataSubmitter: true,
      isMember: false,
      isResearcher: false,
      isSigningOfficial: false,
      roles: [],
      userId: 1001,
    },
    createDate: '2024-01-01T00:00:00.000Z' as unknown as Date,
    dacId: 42,
    translatedDataUse: 'General Research Use',
    deletable: true,
    properties: [],
    study: {
      studyId: 501,
      name: 'Study Alpha',
      description: 'Example study',
      dataTypes: [],
      piName: 'Principal Investigator',
      publicVisibility: false,
      datasetIds: [101],
      datasets: [],
      properties: [],
      createDate: '2024-01-01T00:00:00.000Z',
      createUserId: 1001,
    },
    alias: 7,
    datasetIdentifier: 'DUOS-DS-101',
    dataUse: {
      generalUse: true,
    },
  }

  const mockUsers: DuosUser[] = [
    {
      userId: 2001,
      displayName: 'Test User',
      email: 'user@example.test',
      createDate: '2026-01-01' as unknown as Date,
      emailPreference: false,
      isAdmin: false,
      isAlumni: false,
      isChairPerson: false,
      isDataSubmitter: false,
      isMember: false,
      isResearcher: false,
      isSigningOfficial: false,
      roles: [],
    },
  ]

  const mockRule: MockDACbotRule = {
    id: 9,
    ruleType: 'GRU_V1',
    description: 'Auto-approve GRU datasets',
    ruleState: 'AVAILABLE',
    activationDate: 1712345678901,
    enabledByUserId: 2001,
    displayName: 'Chair User',
    userEmail: 'chair@example.test',
  }

  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(apiUrl)
    cy.stub(Config, 'authOpts').returns({ headers: authHeaders })
  })

  describe('list', () => {
    it('requests the DAC collection without query params when withUsers is omitted', () => {
      cy.intercept('GET', `${apiUrl}/api/dac`, {
        statusCode: 200,
        body: [mockDac],
      }).as('listDacs')

      cy.wrap(DAC.list()).should('deep.equal', [mockDac])

      cy.wait('@listDacs').then(({ request }) => {
        expect(request.url).to.equal(`${apiUrl}/api/dac`)
        expect(request.headers.authorization).to.equal(authHeaders.Authorization)
      })
    })

    it('includes withUsers query param when it is provided', () => {
      cy.intercept('GET', `${apiUrl}/api/dac*`, {
        statusCode: 200,
        body: [mockDac],
      }).as('listDacsWithUsers')

      cy.wrap(DAC.list(true)).should('deep.equal', [mockDac])

      cy.wait('@listDacsWithUsers').then(({ request }) => {
        expect(request.url).to.include('/api/dac?withUsers=true')
      })
    })
  })

  it('create sends the DAC payload and returns the created DAC', () => {
    cy.intercept('POST', `${apiUrl}/api/dac`, {
      statusCode: 200,
      body: mockDac,
    }).as('createDac')

    cy.wrap(DAC.create(mockDac.name!, mockDac.description!, mockDac.email!)).should('deep.equal', mockDac)

    cy.wait('@createDac').then(({ request }) => {
      expect(request.headers['content-type']).to.include('application/json')
      expect(request.body).to.deep.equal({
        name: mockDac.name,
        description: mockDac.description,
        email: mockDac.email,
      })
    })
  })

  it('update sends the DAC id and mutable fields', () => {
    cy.intercept('PUT', `${apiUrl}/api/dac`, {
      statusCode: 200,
      body: mockDac,
    }).as('updateDac')

    cy.wrap(DAC.update(mockDac.dacId!, mockDac.name!, mockDac.description!, mockDac.email!)).should('deep.equal', mockDac)

    cy.wait('@updateDac').then(({ request }) => {
      expect(request.body).to.deep.equal({
        dacId: mockDac.dacId,
        name: mockDac.name,
        description: mockDac.description,
        email: mockDac.email,
      })
    })
  })

  it('delete returns a backward-compatible status object', () => {
    cy.intercept('DELETE', `${apiUrl}/api/dac/${mockDac.dacId}`, {
      statusCode: 200,
      body: {},
    }).as('deleteDac')

    cy.wrap(DAC.delete(mockDac.dacId!)).should('deep.equal', { status: 200 })

    cy.wait('@deleteDac').then(({ request }) => {
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })

  it('get retrieves a single DAC', () => {
    cy.intercept('GET', `${apiUrl}/api/dac/${mockDac.dacId}`, {
      statusCode: 200,
      body: mockDac,
    }).as('getDac')

    cy.wrap(DAC.get(mockDac.dacId!)).should('deep.equal', mockDac)

    cy.wait('@getDac')
  })

  it('datasets retrieves the DAC datasets', () => {
    cy.intercept('GET', `${apiUrl}/api/dac/${mockDac.dacId}/datasets`, {
      statusCode: 200,
      body: [mockDataset],
    }).as('getDatasets')

    cy.wrap(DAC.datasets(mockDac.dacId!)).should('deep.equal', [mockDataset])

    cy.wait('@getDatasets')
  })

  it('autocompleteUsers retrieves matching users', () => {
    cy.intercept('GET', `${apiUrl}/api/dac/users/chair`, {
      statusCode: 200,
      body: mockUsers,
    }).as('autocompleteUsers')

    cy.wrap(DAC.autocompleteUsers('chair')).should('deep.equal', mockUsers)

    cy.wait('@autocompleteUsers')
  })

  it('addDacChair posts to the chair endpoint and returns 200', () => {
    cy.intercept('POST', `${apiUrl}/api/dac/${mockDac.dacId}/chair/2001`, {
      statusCode: 200,
      body: {},
    }).as('addChair')

    cy.wrap(DAC.addDacChair(mockDac.dacId!, 2001)).should('equal', 200)

    cy.wait('@addChair').then(({ request }) => {
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })

  it('removeDacChair deletes from the chair endpoint and returns 200', () => {
    cy.intercept('DELETE', `${apiUrl}/api/dac/${mockDac.dacId}/chair/2001`, {
      statusCode: 200,
      body: {},
    }).as('removeChair')

    cy.wrap(DAC.removeDacChair(mockDac.dacId!, 2001)).should('equal', 200)

    cy.wait('@removeChair')
  })

  it('updateApprovalStatus sends the approval payload and returns the updated dataset', () => {
    cy.intercept('PUT', `${apiUrl}/api/dac/${mockDac.dacId}/dataset/${mockDataset.datasetId}`, {
      statusCode: 200,
      body: { ...mockDataset, dacApproval: true },
    }).as('updateApprovalStatus')

    cy.wrap(DAC.updateApprovalStatus(mockDac.dacId!, mockDataset.datasetId, true)).should('deep.equal', {
      ...mockDataset,
      dacApproval: true,
    })

    cy.wait('@updateApprovalStatus').then(({ request }) => {
      expect(request.body).to.deep.equal({ approval: true })
    })
  })

  it('addDacMember posts to the member endpoint and returns 200', () => {
    cy.intercept('POST', `${apiUrl}/api/dac/${mockDac.dacId}/member/2001`, {
      statusCode: 200,
      body: {},
    }).as('addMember')

    cy.wrap(DAC.addDacMember(mockDac.dacId!, 2001)).should('equal', 200)

    cy.wait('@addMember')
  })

  it('removeDacMember deletes from the member endpoint and returns 200', () => {
    cy.intercept('DELETE', `${apiUrl}/api/dac/${mockDac.dacId}/member/2001`, {
      statusCode: 200,
      body: {},
    }).as('removeMember')

    cy.wrap(DAC.removeDacMember(mockDac.dacId!, 2001)).should('equal', 200)

    cy.wait('@removeMember')
  })

  it('fetchDACbotRules returns the rules list', () => {
    cy.intercept('GET', `${apiUrl}/api/dac/${mockDac.dacId}/rules`, {
      statusCode: 200,
      body: [mockRule],
    }).as('fetchRules')

    cy.wrap(DAC.fetchDACbotRules(mockDac.dacId!)).should('deep.equal', [mockRule])

    cy.wait('@fetchRules')
  })

  it('toggleDACbotRule toggles a rule and returns the updated rule', () => {
    cy.intercept('PUT', `${apiUrl}/api/dac/${mockDac.dacId}/rules/${mockRule.id}/toggle`, {
      statusCode: 200,
      body: { ...mockRule, enabledByUserId: null },
    }).as('toggleRule')

    cy.wrap(DAC.toggleDACbotRule(mockDac.dacId!, mockRule.id)).should('deep.equal', {
      ...mockRule,
      enabledByUserId: null,
    })

    cy.wait('@toggleRule').then(({ request }) => {
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })

  it('surfaces JSON error responses from the API', () => {
    cy.intercept('POST', `${apiUrl}/api/dac`, {
      statusCode: 500,
      body: { message: 'Create DAC failed' },
      headers: { 'content-type': 'application/json' },
    }).as('createDacFailure')

    cy.wrap(DAC.create('Broken DAC', 'desc', 'broken@example.test').catch(error => error)).its('message').should('include', 'Create DAC failed')

    cy.wait('@createDacFailure')
  })
})
