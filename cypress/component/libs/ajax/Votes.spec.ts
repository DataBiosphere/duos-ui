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

  it('updateVotesByIds sends a PUT request and resolves with updated votes array', () => {
    const voteIds = [1, 2, 3]
    const vote = { vote: true, rationale: 'Approved' }
    const votesResponse = [
      { voteId: 1, userId: 10, createDate: '2024-01-01', electionId: 100, displayName: 'User1', type: 'final', vote: true, rationale: 'Approved' },
      { voteId: 2, userId: 11, createDate: '2024-01-01', electionId: 100, displayName: 'User2', type: 'final', vote: true, rationale: 'Approved' },
      { voteId: 3, userId: 12, createDate: '2024-01-01', electionId: 100, displayName: 'User3', type: 'final', vote: true, rationale: 'Approved' },
    ]

    cy.intercept('PUT', `${apiUrl}/api/votes`, {
      statusCode: 200,
      body: votesResponse,
    }).as('updateVotes')

    cy.wrap(Votes.updateVotesByIds(voteIds, vote)).should('deep.equal', votesResponse)
    cy.wait('@updateVotes').then(({ request }) => {
      expect(request.body).to.deep.equal({ vote: true, rationale: 'Approved', voteIds })
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })

  it('updateRationaleByIds sends a PUT request and resolves with updated votes array', () => {
    const voteIds = [4, 5]
    const rationale = 'Needs more info'
    const votesResponse = [
      { voteId: 4, userId: 13, createDate: '2024-01-01', electionId: 101, displayName: 'User4', type: 'final', rationale: 'Needs more info' },
      { voteId: 5, userId: 14, createDate: '2024-01-01', electionId: 101, displayName: 'User5', type: 'final', rationale: 'Needs more info' },
    ]

    cy.intercept('PUT', `${apiUrl}/api/votes/rationale`, {
      statusCode: 200,
      body: votesResponse,
    }).as('updateRationale')

    cy.wrap(Votes.updateRationaleByIds(voteIds, rationale)).should('deep.equal', votesResponse)
    cy.wait('@updateRationale').then(({ request }) => {
      expect(request.body).to.deep.equal({ rationale, voteIds })
      expect(request.headers.authorization).to.equal(authHeaders.Authorization)
    })
  })
})
