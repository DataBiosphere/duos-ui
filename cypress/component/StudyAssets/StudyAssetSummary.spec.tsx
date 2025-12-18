import React from 'react'
import StudyAssetSummary from 'src/components/study_asset/StudyAssetSummary'
import { mount } from 'cypress/react'

interface TestAsset {
  id: string
  name: string
  description: string
  value: number
}

const sampleAsset: TestAsset = {
  id: 'asset1',
  name: 'Test Asset',
  description: 'Test Description',
  value: 100,
}

describe('StudyAssetSummary', () => {
  it('renders asset summary with all columns', () => {
    const editAction = cy.stub()
    const deleteAction = cy.stub()
    const viewAction = cy.stub()

    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={editAction}
        deleteAction={deleteAction}
        viewAction={viewAction}
      />,
    )

    cy.contains('Test Asset').should('exist')
    cy.contains('Test Description').should('exist')
    cy.contains('100').should('exist')
  })

  it('renders only specified columns when columnsToShow is provided', () => {
    const editAction = cy.stub()
    const deleteAction = cy.stub()
    const viewAction = cy.stub()

    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        columnsToShow={['name', 'value']}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={editAction}
        deleteAction={deleteAction}
        viewAction={viewAction}
      />,
    )

    cy.contains('Test Asset').should('exist')
    cy.contains('100').should('exist')
    cy.contains('Test Description').should('not.exist')
  })

  it('calls viewAction when view button is clicked', () => {
    const viewAction = cy.stub()

    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={viewAction}
      />,
    )

    cy.get('.glyphicon-eye-open').parent().click()
    cy.wrap(viewAction).should('have.been.calledOnce')
  })

  it('calls editAction when edit button is clicked', () => {
    const editAction = cy.stub()

    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={editAction}
        deleteAction={cy.stub()}
        viewAction={cy.stub()}
      />,
    )

    cy.get('.glyphicon-pencil').parent().click()
    cy.wrap(editAction).should('have.been.calledOnce')
  })

  it('shows delete modal when delete button is clicked', () => {
    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={cy.stub()}
      />,
    )

    cy.get('.glyphicon-trash').parent().click()
    cy.contains('Delete').should('exist')
  })

  it('calls deleteAction when delete is confirmed', () => {
    const deleteAction = cy.stub()

    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={cy.stub()}
        deleteAction={deleteAction}
        viewAction={cy.stub()}
      />,
    )

    cy.get('.glyphicon-trash').parent().click()
    cy.contains('button', 'Delete').click()
    cy.wrap(deleteAction).should('have.been.calledOnce')
  })

  it('disables edit button when disabled prop is true', () => {
    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={cy.stub()}
        disabled={true}
      />,
    )

    cy.get('.glyphicon-pencil').parent().should('be.disabled')
  })

  it('disables delete button when disableDelete prop is true', () => {
    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        customRenderers={{}}
        name="Test Asset"
        objectName="asset"
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={cy.stub()}
        disableDelete={true}
      />,
    )

    cy.get('.glyphicon-trash').parent().should('be.disabled')
  })

  it('applies custom renderer when provided', () => {
    const customRenderers = {
      value: (val: unknown) => <strong>Custom: {String(val)}</strong>,
    }

    mount(
      <StudyAssetSummary
        asset={sampleAsset}
        columnsToShow={['value']}
        customRenderers={customRenderers}
        name="Test Asset"
        objectName="asset"
        editAction={cy.stub()}
        deleteAction={cy.stub()}
        viewAction={cy.stub()}
      />,
    )

    cy.contains('Custom: 100').should('exist')
  })
})
