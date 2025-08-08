import React from 'react'
import CollectionSubmitVoteBox from 'src/components/collection_vote_box/CollectionSubmitVoteBox'
import { mount } from 'cypress/react'
import { Votes } from 'src/libs/ajax/Votes'
import { votingColors } from 'src/libs/VotingColors'
import { Vote } from 'src/types/model'

const votesMatch: Vote[] = [
  { vote: true, voteId: 1, rationale: 'test', electionStatus: 'Open' } as Vote,
  { vote: true, voteId: 2, rationale: 'test', electionStatus: 'Open' } as Vote,
  { vote: true, voteId: 3, rationale: 'test', electionStatus: 'Open' } as Vote,
]

const votesMixed: Vote[] = [
  { vote: true, voteId: 1, rationale: 'test1', electionStatus: 'Open' } as Vote,
  { vote: false, voteId: 2, rationale: 'test2', electionStatus: 'Open' } as Vote,
]

describe('CollectionSubmitVoteBox - Tests', function () {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('renders yes vote button as selected if all vote values are true and voting is not final', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMatch}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=vote-subsection-heading]').should('not.be.visible')
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
  })

  it('renders unselected buttons if vote values are different and voting is not final', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=vote-subsection-heading]').should('not.be.visible')
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
  })

  it('renders unselected buttons if vote values are null and voting is not disabled', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={[{ voteId: 4 } as Vote]}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=collection-vote-box]').should('exist')
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
  })

  it('renders unselected buttons if list of votes is empty and voting is not disabled', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={[]}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=collection-vote-box]').should('exist')
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
  })

  it('renders unselected buttons if list of votes is null and voting is not disabled', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={[]}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=collection-vote-box]').should('exist')
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
  })

  it('renders existing rationale if rationale is the same for all votes', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMatch}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('textarea').should('have.text', 'test')
  })

  it('Does not render existing rationale in textarea if rationale different between votes', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('textarea').should('not.contain.text')
  })

  it('can always edit rationale textarea when vote is not final', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMatch}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('textarea').should('have.text', 'test')
    cy.get('textarea').type('sample text')
    cy.get('textarea').blur()
    cy.get('textarea').should('have.text', 'testsample text')
    cy.get('textarea').type(' hello')
    cy.get('textarea').blur()
    cy.get('textarea').should('have.text', 'testsample text hello')
    cy.get('[datacy=yes-collection-vote-button]').click()
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes)
    cy.get('textarea').type('{backspace}{backspace}')
    cy.get('textarea').blur()
    cy.get('textarea').should('have.text', 'testsample text hel')
  })

  it('can always edit vote value when vote is not final', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=yes-collection-vote-button]').click()
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.yes)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').click()
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no)
  })

  it('can edit rationale textarea multiple times before voting when vote is final', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('textarea').should('have.text', '')
    cy.get('textarea').type('sample text')
    cy.get('textarea').blur()
    cy.get('textarea').should('have.text', 'sample text')
    cy.get('textarea').type(' test')
    cy.get('textarea').blur()
    cy.get('textarea').should('have.text', 'sample text test')
  })

  it('can not edit rationale textarea after voting when vote is final', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.stub(Votes, 'updateVotesByIds')

    cy.get('textarea').should('have.text', '')
    cy.get('textarea').type('sample text')
    cy.get('textarea').blur()
    cy.get('textarea').should('have.text', 'sample text')
    cy.get('[datacy=no-collection-vote-button]').click()
    cy.get('textarea').should('be.disabled')
  })

  it('replaces buttons with vote result text after voting when isFinal is true', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={true}
        adminPage={false}
        isLoading={false}
        isDisabled={false}
        bucketKey=""
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.stub(Votes, 'updateVotesByIds')

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', '(Vote and Rationale cannot be updated after submitting)')
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').click()
    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NO')
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist')
    cy.get('[datacy=no-collection-vote-button]').should('not.exist')
  })

  it('renders vote result text instead of buttons when vote values match and isFinal is true', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMatch}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'YES')
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist')
    cy.get('[datacy=no-collection-vote-button]').should('not.exist')
  })

  it('disables vote buttons and text area if page is loading', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={true}
        isDisabled={false}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.stub(Votes, 'updateVotesByIds')

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=yes-collection-vote-button]').click()
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('textarea').should('be.disabled')
  })

  it('replaces buttons with vote result text if isDisabled prop is true', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={true}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.stub(Votes, 'updateVotesByIds')

    cy.get('[data-cy=vote-subsection-heading]').should('have.text', 'NOT SELECTED')
    cy.get('textarea').should('be.disabled')
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist')
    cy.get('[datacy=no-collection-vote-button]').should('not.exist')
  })

  it('disables yes vote button if isApprovalDisabled is true', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.stub(Votes, 'updateVotesByIds')

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=yes-collection-vote-button]').click()
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
  })

  it('does not disable no vote button if isApprovalDisabled is true', function () {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.stub(Votes, 'updateVotesByIds')

    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').click()
    cy.get('[datacy=yes-collection-vote-button]').should('have.css', 'background-color', votingColors.default)
    cy.get('[datacy=no-collection-vote-button]').should('have.css', 'background-color', votingColors.no)
    cy.get('textarea').should('not.be.disabled')
  })

  it('renders a different heading if user is viewing from the admin page (Dataset)', () => {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={true}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=vote-subsection-heading]').should('exist')
    cy.get('[data-cy=vote-subsection-heading]').contains('The vote has not been finalized')
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist')
    cy.get('[datacy=no-collection-vote-button]').should('not.exist')
  })

  it('renders a different heading if user is viewing from the admin page (RP)', () => {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMixed}
        isFinal={false}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={true}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=vote-subsection-heading]').should('exist')
    cy.get('[data-cy=vote-subsection-heading]').contains('The vote has not been finalized')
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist')
    cy.get('[datacy=no-collection-vote-button]').should('not.exist')
  })

  it('shows the final vote and renders the component read-only for admin page', () => {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={votesMatch}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={true}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=vote-subsection-heading]').should('exist')
    cy.get('[data-cy=vote-subsection-heading]').contains('The final vote is: YES')
    cy.get('textarea').should('be.disabled')
    cy.get('[datacy=yes-collection-vote-button]').should('not.exist')
    cy.get('[datacy=no-collection-vote-button]').should('not.exist')
  })

  it('shows the radar vote icon when the vote type is radar', () => {
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={[{ vote: true, voteId: 1, type: 'RADAR_APPROVE', rationale: 'Radar Approve' } as Vote]}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={true}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={() => {}}
        reloadFn={() => {}}
      />,
    )
    cy.get('[data-cy=radar-icon]').should('exist')
  })

  it('shows disabled Yes/No buttons as member when election is closed', () => {
    const updateFunction = cy.spy().as('updateFunction')
    mount(
      <CollectionSubmitVoteBox
        question="question"
        votes={[{ type: 'FINAL', rationale: 'Approved', electionStatus: 'closed' } as Vote]}
        isFinal={true}
        isLoading={false}
        isDisabled={false}
        isApprovalDisabled={true}
        adminPage={false}
        bucketKey="collection-submit-vote-box"
        updateFinalVote={updateFunction}
        reloadFn={() => {}}
      />,
    )
    cy.get('[datacy=yes-collection-vote-button]').should('exist')
    cy.get('[datacy=yes-collection-vote-button]').click()
    cy.get('@updateFunction').should('not.have.been.called')
    cy.get('[datacy=no-collection-vote-button]').should('exist')
    cy.get('[datacy=no-collection-vote-button]').click()
    cy.get('@updateFunction').should('not.have.been.called')
  })
})
