import { DAA } from 'src/libs/ajax/DAA'
import { Config } from 'src/libs/config'
import type { DAAObject } from 'src/types/model'

describe('DAA ajax', () => {
  const apiUrl = 'https://api.example.test'
  const authHeaders = {
    'Authorization': 'Bearer test-token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  }

  const mockDaa: DAAObject = {
    broadDaa: false,
    daaId: 12,
    createUserId: 1001,
    createDate: '2026-01-01',
    updateUserId: 1001,
    updateDate: '2026-01-10',
    initialDacId: 42,
    file: {
      fileStorageObjectId: 88,
      entityId: '12',
      fileName: 'Sample_DAA.pdf',
      category: 'dataAccessAgreement',
      mediaType: 'application/pdf',
      createUserId: 1001,
      createDate: 1700000000000,
    },
    dacs: [],
  }

  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(apiUrl)
    cy.stub(Config, 'authOpts').returns({ headers: authHeaders })
  })

  it('getDaas sends a GET request and returns data', () => {
    cy.intercept('GET', `${apiUrl}/api/daa`, {
      statusCode: 200,
      body: [mockDaa],
    }).as('getDaas')

    cy.wrap(DAA.getDaas()).should('deep.equal', [mockDaa])

    cy.wait('@getDaas').then(({ request }) => {
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })

  it('getDaaById sends a GET request and returns one DAA', () => {
    cy.intercept('GET', `${apiUrl}/api/daa/${mockDaa.daaId}`, {
      statusCode: 200,
      body: mockDaa,
    }).as('getDaaById')

    cy.wrap(DAA.getDaaById(mockDaa.daaId)).should('deep.equal', mockDaa)

    cy.wait('@getDaaById')
  })

  it('createDaaLcLink returns status 200 when successful', () => {
    cy.intercept('PUT', `${apiUrl}/api/daa/${mockDaa.daaId}/2001`, {
      statusCode: 200,
      body: mockDaa,
    }).as('createLink')

    cy.wrap(DAA.createDaaLcLink(mockDaa.daaId, 2001)).should('deep.equal', mockDaa)

    cy.wait('@createLink').then(({ request }) => {
      expect(request.body).to.deep.equal({})
    })
  })

  it('deleteDaaLcLink returns status 200 when successful', () => {
    cy.intercept('DELETE', `${apiUrl}/api/daa/${mockDaa.daaId}/2001`, {
      statusCode: 200,
      body: {},
    }).as('deleteLink')

    cy.wrap(DAA.deleteDaaLcLink(mockDaa.daaId, 2001)).should('equal', 200)

    cy.wait('@deleteLink')
  })

  it('bulkAddUsersToDaa returns status 200 and sends user ids', () => {
    const users = [1, 2, 3]

    cy.intercept('POST', `${apiUrl}/api/daa/bulk/${mockDaa.daaId}`, {
      statusCode: 200,
      body: {},
    }).as('bulkAddUsers')

    cy.wrap(DAA.bulkAddUsersToDaa(mockDaa.daaId, users)).should('equal', 200)

    cy.wait('@bulkAddUsers').then(({ request }) => {
      expect(request.body).to.deep.equal(users)
    })
  })

  it('bulkRemoveUsersFromDaa returns status 200 and sends user ids in DELETE body', () => {
    const users = [3, 4]

    cy.intercept('DELETE', `${apiUrl}/api/daa/bulk/${mockDaa.daaId}`, {
      statusCode: 200,
      body: {},
    }).as('bulkRemoveUsers')

    cy.wrap(DAA.bulkRemoveUsersFromDaa(mockDaa.daaId, users)).should('equal', 200)

    cy.wait('@bulkRemoveUsers').then(({ request }) => {
      expect(request.body).to.deep.equal(users)
    })
  })

  it('bulkAddDaasToUser returns status 200 and sends daa ids', () => {
    const daas = [10, 11]

    cy.intercept('POST', `${apiUrl}/api/daa/bulk/user/2001`, {
      statusCode: 200,
      body: {},
    }).as('bulkAddDaasToUser')

    cy.wrap(DAA.bulkAddDaasToUser(2001, daas)).should('equal', 200)

    cy.wait('@bulkAddDaasToUser').then(({ request }) => {
      expect(request.body).to.deep.equal(daas)
    })
  })

  it('bulkRemoveDaasFromUser returns status 200 and sends daa ids in DELETE body', () => {
    const daas = [10, 11]

    cy.intercept('DELETE', `${apiUrl}/api/daa/bulk/user/2001`, {
      statusCode: 200,
      body: {},
    }).as('bulkRemoveDaasFromUser')

    cy.wrap(DAA.bulkRemoveDaasFromUser(2001, daas)).should('equal', 200)

    cy.wait('@bulkRemoveDaasFromUser').then(({ request }) => {
      expect(request.body).to.deep.equal(daas)
    })
  })

  it('getDaaFileById requests binary content', () => {
    cy.intercept('GET', `${apiUrl}/api/daa/${mockDaa.daaId}/file`, {
      statusCode: 200,
      body: 'fake-binary-content',
      headers: { 'content-type': 'application/octet-stream' },
    }).as('getDaaFile')

    cy.wrap(DAA.getDaaFileById(mockDaa.daaId, 'Sample_DAA.pdf')).should('equal', undefined)

    cy.wait('@getDaaFile').then(({ request }) => {
      expect(request.headers.accept).to.equal('application/octet-stream')
      expect(request.headers['content-type']).to.equal('application/octet-stream')
    })
  })

  it('createDaa returns null payload for empty file', () => {
    cy.wrap(DAA.createDaa(null, 42)).should('deep.equal', { data: null })
  })

  it('createDaa uploads form-data and returns created DAA', () => {
    cy.intercept('POST', `${apiUrl}/api/daa/dac/42`, {
      statusCode: 200,
      body: mockDaa,
    }).as('createDaa')

    cy.window().then((win) => {
      const file = new win.File(['test-data'], 'my-daa.pdf', { type: 'application/pdf' })
      cy.wrap(DAA.createDaa(file, 42)).its('data').should('deep.equal', mockDaa)
    })

    cy.wait('@createDaa').then(({ request }) => {
      expect(String(request.body)).to.include('my-daa.pdf')
    })
  })

  it('addDaaToDac returns status 200', () => {
    cy.intercept('PUT', `${apiUrl}/api/daa/${mockDaa.daaId}/dac/42`, {
      statusCode: 200,
      body: {},
    }).as('addDaaToDac')

    cy.wrap(DAA.addDaaToDac(mockDaa.daaId, 42)).should('equal', 200)

    cy.wait('@addDaaToDac')
  })

  it('sendDaaUpdateEmails returns status 200', () => {
    cy.intercept('POST', `${apiUrl}/api/daa/42/updated/11/New-DAA.pdf`, {
      statusCode: 200,
      body: {},
    }).as('sendDaaUpdateEmails')

    cy.wrap(DAA.sendDaaUpdateEmails(42, 11, 'New-DAA.pdf')).should('equal', 200)

    cy.wait('@sendDaaUpdateEmails')
  })
})
