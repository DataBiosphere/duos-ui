import React from 'react'
import CollapseExpandLink from 'src/components/collection_voting_slab/CollapsibleExpandLink'

describe('CollapseExpandLink', () => {
  it('does not render if hiddenDatasetCount is 0', () => {
    cy.mount(
      <CollapseExpandLink
        hiddenDatasetCount={0}
        expanded={false}
        onExpand={cy.stub().as('onExpand')}
        onCollapse={cy.stub().as('onCollapse')}
      />,
    )
    cy.get('[data-cy=collapse-expand-link]').should('not.exist')
  })

  it('renders expand link when not expanded', () => {
    cy.mount(
      <CollapseExpandLink
        hiddenDatasetCount={2}
        expanded={false}
        onExpand={cy.stub().as('onExpand')}
        onCollapse={cy.stub().as('onCollapse')}
      />,
    )
    cy.get('[data-cy=collapse-expand-link]').should('contain.text', '+ View 2 more')
  })

  it('renders collapse link when expanded', () => {
    cy.mount(
      <CollapseExpandLink
        hiddenDatasetCount={3}
        expanded={true}
        onExpand={cy.stub().as('onExpand')}
        onCollapse={cy.stub().as('onCollapse')}
      />,
    )
    cy.get('[data-cy=collapse-expand-link]').should('contain.text', '- View 3 less')
  })

  it('calls onExpand when expand link is clicked', () => {
    const onExpand = cy.stub().as('onExpand')
    cy.mount(
      <CollapseExpandLink
        hiddenDatasetCount={1}
        expanded={false}
        onExpand={onExpand}
        onCollapse={cy.stub()}
      />,
    )
    cy.get('[data-cy=collapse-expand-link]').click()
    cy.get('@onExpand').should('have.been.calledOnce')
  })

  it('calls onCollapse when collapse link is clicked', () => {
    const onCollapse = cy.stub().as('onCollapse')
    cy.mount(
      <CollapseExpandLink
        hiddenDatasetCount={1}
        expanded={true}
        onExpand={cy.stub()}
        onCollapse={onCollapse}
      />,
    )
    cy.get('[data-cy=collapse-expand-link]').click()
    cy.get('@onCollapse').should('have.been.calledOnce')
  })
})
