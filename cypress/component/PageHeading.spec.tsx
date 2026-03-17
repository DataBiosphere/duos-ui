import React from 'react'
import { PageHeading } from 'src/components/PageHeading'

describe('PageHeading', () => {
  it('renders title and description', () => {
    cy.mount(
      <PageHeading id="test" title="My Title" description="My Description" />,
    )
    cy.get('#test_heading').should('exist')
    cy.get('#test_title').should('have.text', 'My Title')
    cy.get('#test_description').should('have.text', 'My Description')
  })

  it('does not render an icon when imgSrc is not provided', () => {
    cy.mount(
      <PageHeading id="test" title="No Icon" />,
    )
    cy.get('#test_icon').should('not.exist')
  })

  it('renders an icon when imgSrc is provided', () => {
    cy.mount(
      <PageHeading id="test" title="With Icon" imgSrc="/logo.png" />,
    )
    cy.get('#test_icon')
      .should('exist')
      .and('have.attr', 'src', '/logo.png')
      .and('have.attr', 'alt', 'With Icon')
  })

  it('applies the color class to the title', () => {
    cy.mount(
      <PageHeading id="test" title="Colored" color="common" />,
    )
    cy.get('#test_title').should('have.class', 'common-color')
  })

  it('applies medium margin by default', () => {
    cy.mount(
      <PageHeading id="test" title="Default Margin" />,
    )
    cy.get('#test_heading > div').should('have.css', 'margin-left', '55px')
  })

  it('applies large margin when iconSize is large', () => {
    cy.mount(
      <PageHeading id="test" title="Large Margin" iconSize="large" />,
    )
    cy.get('#test_heading > div').should('have.css', 'margin-left', '70px')
  })

  it('applies no margin when iconSize is none', () => {
    cy.mount(
      <PageHeading id="test" title="No Margin" iconSize="none" />,
    )
    cy.get('#test_heading > div').should('have.css', 'margin-left', '0px')
  })

  it('uses custom descriptionStyle when provided', () => {
    const customStyle = { color: 'rgb(255, 0, 0)', fontSize: '24px' }
    cy.mount(
      <PageHeading
        id="test"
        title="Custom Style"
        description="Styled"
        descriptionStyle={customStyle}
      />,
    )
    cy.get('#test_description')
      .should('have.css', 'color', 'rgb(255, 0, 0)')
      .and('have.css', 'font-size', '24px')
  })

  it('uses default description style when descriptionStyle is not provided', () => {
    cy.mount(
      <PageHeading id="test" title="Default Style" description="Default" />,
    )
    cy.get('#test_description').should('have.css', 'font-size', '19px')
  })
})
