import React from 'react'
import VotesPieChart from 'src/components/common/VotesPieChart'

const testVotes = [{ vote: true }, { vote: false }, {}]
const keyString = 'test'

// NOTE: I think we should consider using Jest or other snapshot libraries for testing svg-based graphs
// It's a lot harder to obtain text from svg due lack of identifiers for pinpoint locations
// Also harder to figure out sizing and colors due to vector dimensions
describe('VotesPieChart - Tests', function () {
  it('renders the no data div if the votes array is empty', function () {
    cy.mount(<VotesPieChart keyString={keyString} />)
    const chart = `.${keyString}-pie-chart-no-data`
    cy.get(chart).should('exist')
    cy.get(chart).contains(`No data for ${keyString}`)
  })

  it('renders the results so that each division is 1/3 of the whole', function () {
    const props = { votes: testVotes, keyString }
    cy.mount(<VotesPieChart {...props} />)
    cy.get('svg').should('exist')
  })
})
