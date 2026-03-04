import React from 'react'
import ResearchProposalSlab from 'src/components/collection_voting_slab/ResearchProposalSlab'

const darInfoPrimaryUseManualReviewFalse = {
  rus: 'test',
  diseases: true,
}

const darInfoSecondaryUseManualReviewTrue = {
  stigmatizedDiseases: true,
}

const darInfoPrimarySecondaryUse = {
  diseases: true,
  illegalBehavior: true,
}

const primaryUseCode = 'DS'
const secondaryUseCode = 'OTHER'

const showNarrativeLinkText = '(Show)'
const hideNarrativeLinkText = '(Hide)'

describe('ResearchProposalSlab - Tests', function () {
  it('Can collapse expanded view', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />,
    )
    cy.get('[data-cy=rp-slab]').should('be.visible')
    cy.contains(hideNarrativeLinkText).click()
    cy.get('[data-cy=rp-expanded]').should('not.exist')
  })

  it('Renders primary data use pill', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />,
    )
    cy.contains(primaryUseCode)
    cy.get(secondaryUseCode).should('not.exist')
  })

  it('Renders secondary data use pill', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />,
    )
    cy.contains(secondaryUseCode)
    cy.get(primaryUseCode).should('not.exist')
  })

  it('Renders primary and secondary data use pills', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimarySecondaryUse}
      />,
    )
    cy.contains(primaryUseCode)
    cy.contains(secondaryUseCode)
  })

  it('Renders link to show narrative when collapsed', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimarySecondaryUse}
      />,
    )
    cy.contains(hideNarrativeLinkText).click()
    cy.contains(showNarrativeLinkText)
  })

  it('Renders link to hide narrative when expanded', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimarySecondaryUse}
        bucket={{ key: 'test' }}
      />,
    )
    cy.contains(hideNarrativeLinkText)
  })

  it('Renders data use pills', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimarySecondaryUse}
        bucket={{ key: 'test' }}
      />,
    )
    cy.contains(primaryUseCode)
    cy.contains(secondaryUseCode)
  })

  it('Renders research purpose when expanded', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        bucket={{ key: 'test' }}
      />,
    )
    cy.get('[data-cy=research-purpose]').should('exist')
    cy.contains('test')
  })

  it('Does not render research purpose when collapsed', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
      />,
    )
    cy.contains(hideNarrativeLinkText).click()
    cy.get('[data-cy=research-purpose]').should('not.exist')
    cy.get('test').should('not.exist')
  })

  it('Renders data use alert box when expanded with manually reviewed data uses', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        bucket={{ key: 'test' }}
      />,
    )
    cy.get('[datacy=alert-box]').should('exist')
  })

  it('Does not render data use alert box when expanded without manually reviewed data uses', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        bucket={{ key: 'test' }}
      />,
    )
    cy.get('[data-cy=alert-box]').should('not.exist')
  })

  it('Does not render data use alert box when collapsed', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
      />,
    )
    cy.contains(hideNarrativeLinkText).click()
    cy.get('[data-cy=alert-box]').should('not.exist')
  })

  it('Does not render data use summary when loading', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimarySecondaryUse}
        isLoading={true}
      />,
    )
    cy.get(primaryUseCode).should('not.exist')
    cy.get(secondaryUseCode).should('not.exist')
  })

  it('Does not render link to expand/collapse when loading', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoSecondaryUseManualReviewTrue}
        isLoading={true}
      />,
    )
    cy.get('#rp-narrative-toggle').should('not.exist')
  })

  it('Renders skeleton when loading', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        isLoading={true}
      />,
    )
    cy.get('.text-placeholder').should('exist')
  })

  it('Does not render skeleton when not loading', function () {
    cy.mount(
      <ResearchProposalSlab
        darInfo={darInfoPrimaryUseManualReviewFalse}
        isLoading={false}
      />,
    )
    cy.get('.text-placeholder').should('not.exist')
  })
})
