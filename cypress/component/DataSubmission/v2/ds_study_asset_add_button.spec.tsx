import React from 'react'
import { mount } from 'cypress/react'
import StudyAssetAddButton from 'src/pages/data_submission/v2/StudyAssetAddButton'

describe('StudyAssetAddButton', () => {
  it('renders with required props', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
      />,
    )

    cy.get('#test-button').should('exist')
    cy.get('#test-button').should('contain.text', 'Add Test')
    cy.get('#test-button').find('svg').should('exist') // AddIcon
  })

  it('calls onClick when clicked', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
      />,
    )

    cy.get('#test-button').click()
    cy.get('@onClickSpy').should('have.been.calledOnce')
  })

  it('does not call onClick when disabled', () => {
    const onClickSpy = cy.spy().as('onClickSpy')

    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={onClickSpy}
        disabled={true}
      />,
    )

    cy.get('#test-button').should('be.disabled')
    cy.get('#test-button').click({ force: true })
    cy.get('@onClickSpy').should('not.have.been.called')
  })

  it('applies correct styling when disabled', () => {
    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        disabled={true}
      />,
    )

    cy.get('#test-button').should('have.css', 'cursor', 'not-allowed')
  })

  it('shows validation error styling', () => {
    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        hasValidationError={true}
      />,
    )

    cy.get('#test-button').should('have.css', 'border', '1px solid rgb(255, 0, 0)')
    cy.get('#test-button').should('have.css', 'box-shadow').and('include', 'rgb(255, 0, 0)')
  })

  it('shows default styling without validation error', () => {
    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
        hasValidationError={false}
      />,
    )

    cy.get('#test-button').should('have.css', 'border').and('include', 'rgb(9, 72, 183)')
    cy.get('#test-button').should('have.css', 'box-shadow', 'none')
  })

  it('applies button-white class', () => {
    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    cy.get('#test-button').should('have.class', 'button')
    cy.get('#test-button').should('have.class', 'button-white')
  })

  it('applies correct layout styles', () => {
    mount(
      <StudyAssetAddButton
        id="test-button"
        label="Add Test"
        onClick={() => {}}
      />,
    )

    cy.get('#test-button').should('have.css', 'display', 'flex')
    cy.get('#test-button').should('have.css', 'align-items', 'center')
    cy.get('#test-button').should('have.css', 'margin-top', '0px')
    cy.get('#test-button').should('have.css', 'margin-bottom', '5px')
  })
})
