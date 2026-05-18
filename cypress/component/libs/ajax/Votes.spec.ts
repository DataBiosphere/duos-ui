import { Votes } from 'src/libs/ajax/Votes'
import { Config } from 'src/libs/config'

describe('Votes ajax', () => {
  const apiUrl = 'https://api.example.test'
  const authHeaders = {
    'Authorization': 'Bearer test-token',
    'Accept': 'application/json',
    'X-App-ID': 'DUOS',
  }

  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(apiUrl)
    cy.stub(Config, 'authOpts').returns({ headers: authHeaders })
  })

  it('updateVotesByIds sends a PUT request and resolves with no data', () => {
    const voteIds = [1, 2, 3]
    const vote = { vote: true, rationale: 'Approved' }
    const response = { success: true, updated: voteIds }

    cy.intercept('PUT', `${apiUrl}/api/votes`, {
      statusCode: 200,
      body: response,
    }).as('updateVotes')

    cy.wrap(Votes.updateVotesByIds(voteIds, vote)).should('be.undefined')
    cy.wait('@updateVotes').then(({ request }) => {
      expect(request.body).to.deep.equal({ vote: true, rationale: 'Approved', voteIds })
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })

  it('updateRationaleByIds sends a PUT request and resolves with no data', () => {
    const voteIds = [4, 5]
    const rationale = 'Needs more info'
    const response = { success: true, updated: voteIds }

    cy.intercept('PUT', `${apiUrl}/api/votes/rationale`, {
      statusCode: 200,
      body: response,
    }).as('updateRationale')

    cy.wrap(Votes.updateRationaleByIds(voteIds, rationale)).should('be.undefined')
    cy.wait('@updateRationale').then(({ request }) => {
      expect(request.body).to.deep.equal({ rationale, voteIds })
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })
})
