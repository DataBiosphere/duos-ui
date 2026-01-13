import React from 'react'
import { TableHeaderSection } from 'src/components/TableHeaderSection'

describe('TableHeaderSection', () => {
  const mockIcon = {
    src: '/test-icon.png',
    width: 64,
    height: 64,
  }

  it('renders title and description', () => {
    cy.mount(
      <TableHeaderSection
        title="Test Title"
        description="Test Description"
      />,
    )

    cy.contains('Test Title').should('be.visible')
    cy.contains('Test Description').should('be.visible')
  })

  it('renders icon when provided', () => {
    cy.mount(
      <TableHeaderSection
        icon={mockIcon}
        title="Test Title"
        description="Test Description"
      />,
    )

    cy.get('img[alt="Dataset Icon"]')
      .should('be.visible')
      .and('have.attr', 'src', mockIcon.src)
  })

  it('does not render icon when not provided', () => {
    cy.mount(
      <TableHeaderSection
        title="Test Title"
        description="Test Description"
      />,
    )

    cy.get('img[alt="Dataset Icon"]').should('not.exist')
  })

  it('does not render icon when src is missing', () => {
    cy.mount(
      <TableHeaderSection
        icon={{ src: '', width: 64 }}
        title="Test Title"
        description="Test Description"
      />,
    )

    cy.get('img[alt="Dataset Icon"]').should('not.exist')
  })

  it('applies custom width and height to icon', () => {
    cy.mount(
      <TableHeaderSection
        icon={{ src: '/test.png', width: 100, height: 50 }}
        title="Test Title"
        description="Test Description"
      />,
    )

    cy.get('img[alt="Dataset Icon"]')
      .should('have.css', 'width', '100px')
      .and('have.css', 'height', '50px')
  })

  it('renders React nodes as title and description', () => {
    const titleNode = <span>Custom Title</span>
    const descNode = <span>Custom Description</span>

    cy.mount(
      <TableHeaderSection
        title={titleNode}
        description={descNode}
      />,
    )

    cy.contains('Custom Title').should('be.visible')
    cy.contains('Custom Description').should('be.visible')
  })

  it('has correct data-cy attributes', () => {
    cy.mount(
      <TableHeaderSection
        title="Test Title"
        description="Test Description"
      />,
    )

    cy.get('[data-cy="table-header-title"]')
      .should('be.visible')
      .and('contain', 'Test Title')
    cy.get('[data-cy="table-header-description"]')
      .should('be.visible')
      .and('contain', 'Test Description')
  })
})
