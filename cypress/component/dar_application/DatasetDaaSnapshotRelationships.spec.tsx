import React from 'react'
import { DatasetDaaSnapshotRelationships } from 'src/pages/dar_application/DatasetDaaSnapshotRelationships'
import { DAR } from 'src/libs/ajax/DAR'
import { DAA } from 'src/libs/ajax/DAA'

describe('DatasetDaaSnapshotRelationships', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  it('renders dataset and DAA rows from snapshot response', () => {
    cy.stub(DAR, 'getDatasetDaaSnapshots').resolves([
      {
        datasetId: 101,
        datasetIdentifier: 'DUOS-101',
        datasetName: 'Dataset Alpha',
        daaId: 501,
        daaName: 'Broad DAA',
        daaFileName: 'BroadDAA.pdf',
      },
    ])

    cy.mount(<DatasetDaaSnapshotRelationships referenceId="DAR-123" />)

    cy.contains('Dataset and Data Access Agreement Relationships').should('be.visible')
    cy.contains('Dataset Alpha').should('be.visible')
    cy.contains('DUOS-101').should('be.visible')
    cy.contains('Broad DAA').should('be.visible')
    cy.contains('button', 'Download and view').should('be.visible')
  })

  it('handles wrapped datasetDaaSnapshots response and shows empty state', () => {
    cy.stub(DAR, 'getDatasetDaaSnapshots').resolves({ datasetDaaSnapshots: [] })

    cy.mount(<DatasetDaaSnapshotRelationships referenceId="DAR-EMPTY" />)

    cy.contains('No dataset and data access agreement relationships are available for this submission.').should('be.visible')
  })

  it('downloads and opens the DAA when clicking Download and view', () => {
    const getSnapshotsStub = cy.stub(DAR, 'getDatasetDaaSnapshots').resolves([
      {
        dataset: {
          datasetId: 202,
          datasetIdentifier: 'DUOS-202',
          name: 'Dataset Beta',
        },
        daa: {
          daaId: 777,
          name: 'Custom DAA',
          file: {
            fileName: 'CustomDAA.pdf',
          },
        },
      },
    ])

    const daaBlob = new Blob(['dummy'], { type: 'application/pdf' })
    const getBlobStub = cy.stub(DAA, 'getDaaFileBlob').resolves(daaBlob)

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').returns('blob:mock-url')
      cy.stub(win.URL, 'revokeObjectURL').as('revokeObjectURL')
      cy.stub(win, 'open').as('windowOpen')
    })

    cy.mount(<DatasetDaaSnapshotRelationships referenceId="DAR-OPEN" />)

    cy.contains('button', 'Download and view').click()

    cy.then(() => {
      expect(getSnapshotsStub).to.have.been.calledWith('DAR-OPEN')
      expect(getBlobStub).to.have.been.calledWith(777)
    })

    cy.get('@windowOpen').should('have.been.calledWith', 'blob:mock-url', '_blank', 'noopener,noreferrer')
  })
})
