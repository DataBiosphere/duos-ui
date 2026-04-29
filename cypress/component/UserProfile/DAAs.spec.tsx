import React from 'react'
import DAAs from 'src/pages/user_profile/DAAs'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, FileStorageObject } from 'src/types/model'

describe('DAAs', () => {
  const fso: FileStorageObject = {
    fileStorageObjectId: 1,
    entityId: 'entity-1',
    fileName: 'test-agreement.pdf',
    category: 'irbCollaborationLetter',
    mediaType: 'application/pdf',
    createUserId: 3,
    createDate: new Date().getDate(),
  }

  const daa: DAAObject = {
    broadDaa: false,
    daaId: 1,
    createUserId: 3,
    createDate: new Date().toISOString(),
    updateUserId: 3,
    updateDate: new Date().toISOString(),
    initialDacId: 1,
    file: fso,
    dacs: [],
  }

  const issuedBy = 'Test Signing Official'
  const issuedOn = '2024-06-15T00:00:00.000Z'

  beforeEach(() => {
    cy.viewport(800, 600)
    cy.initApplicationConfig()
    cy.stub(DAA, 'getDaaFileById').resolves(undefined)
  })

  it('renders a download link for each DAA', () => {
    cy.mount(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)

    cy.contains('test-agreement').should('exist')
  })

  it('renders the issued-by name and formatted date', () => {
    const expectedDate = new Date(issuedOn).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

    cy.mount(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)

    cy.contains('Issued by').should('exist')
    cy.contains(issuedBy).should('exist')
    cy.contains(expectedDate).should('exist')
  })

  it('renders multiple DAAs', () => {
    const daa2: DAAObject = {
      ...daa,
      daaId: 2,
      file: { ...fso, fileStorageObjectId: 2, fileName: 'second-agreement.pdf' },
    }

    cy.mount(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa, daa2]} />)

    cy.contains('test-agreement').should('exist')
    cy.contains('second-agreement').should('exist')
  })

  it('renders nothing when daas array is empty', () => {
    cy.mount(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[]} />)

    cy.get('a').should('not.exist')
  })

  it('strips the file extension from the displayed file name', () => {
    cy.mount(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)

    cy.contains('test-agreement').should('exist')
    cy.contains('test-agreement.pdf').should('not.exist')
  })

  it('calls DAA.getDaaFileById with the correct id and name when download is clicked', () => {
    cy.mount(<DAAs issuedOn={issuedOn} issuedBy={issuedBy} daas={[daa]} />)

    cy.contains('test-agreement').click()
    cy.wrap(DAA.getDaaFileById).should('have.been.calledWith', daa.daaId, 'test-agreement')
  })
})
