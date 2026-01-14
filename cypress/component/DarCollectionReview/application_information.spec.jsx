import React from 'react'
import ApplicationInformation from 'src/pages/dar_collection_review/ApplicationInformation'

describe('Application Information', () => {
  it('renders the page', () => {
    const props = {}
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.application-information-page').should('exist')
  })

  it('renders researcher information', () => {
    const props = { researcher: 'test person' }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get(`#researcher-label`).should('exist').contains('Researcher')
    cy.get(`#researcher-span`).should('exist').contains('test person')
  })

  it('renders email information', () => {
    const props = { email: 'test email' }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get(`#researcher-email-label`).should('exist').contains('Researcher Email')
    cy.get(`#researcher-email-span`).should('exist').contains('test email')
  })

  it('renders institution information', () => {
    const props = { institution: 'test' }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get(`#institution-label`).should('exist').contains('Institution')
    cy.get(`#institution-span`).should('exist').contains('test')
  })

  it('renders the Non Technical Summary', () => {
    const props = { nonTechSummary: 'test' }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.non-technical-summary-subheader').should('exist')
    cy.get('.non-technical-summary-textbox').should('exist').contains('test')
  })

  it('renders the RUS', () => {
    const props = { rus: 'test' }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.rus-subheader').should('exist')
    cy.get('.rus-textbox').should('exist').contains('test')
  })

  it('renders the collaborator details container and sub-header if any provided', () => {
    const props = {
      externalCollaborators: [{ name: 'Person A' }, { name: 'Person B' }],
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.collaborator-details-container').should('exist')
    cy.get('.collaborator-details-subheader').should('exist').contains('Collaborators')
  })

  it('does not render collaborator details container and sub-header if none provided', () => {
    const props = {}
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.collaborator-details-container').should('not.be.visible')
  })

  it('renders institution details container and sub-header', () => {
    const props = {}
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.institution-details-container').should('exist')
    cy.get('.institution-details-subheader').should('exist').contains('Institution')
  })

  it('renders cloud use container and sub-header', () => {
    const props = {}
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('.cloud-use-details-container').should('exist')
    cy.get('.cloud-use-details-subheader').should('exist').contains('Cloud Use')
  })

  it('renders the cloud computing provider information if provided', () => {
    const props = {
      cloudProvider: 'test name',
      cloudProviderDescription: 'test description',
      cloudComputing: true,
    }

    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#cloud-computing-label').should('exist').contains('Requesting permission to use cloud computing')
    cy.get('#cloud-computing-span').should('exist').contains('Yes')
    cy.get('#cloud-provider-label').should('exist').contains('Cloud Provider (description below')
    cy.get('#cloud-provider-span').should('exist').contains('test name')
    cy.get('.cloud-provider-description-textbox').should('exist').contains('test description')
  })

  it('hides the cloud computing details if cloud computing is false', () => {
    const props = {
      cloudProvider: 'test name',
      cloudProviderDescription: 'test description',
      cloudComputing: false,
    }

    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#cloud-computing-label').should('exist').contains('Requesting permission to use cloud computing')
    cy.get('#cloud-computing-span').should('exist').contains('No')
    cy.get('#cloud-provider-label').should('not.exist')
    cy.get('#cloud-provider-span').should('not.exist')
    cy.get('.cloud-provider-description-textbox').should('not.exist')
  })

  it('renders the local computing information', () => {
    const props = {
      localComputing: false,
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#local-computing-label').should('exist').contains('Requesting permission to use local computing')
    cy.get('#local-computing-span').should('exist').contains('No')
  })

  it('renders a list of external collaborators', () => {
    const props = {
      externalCollaborators: [{ name: 'Person A' }, { name: 'Person B' }],
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#external-collaborators-label').should('exist').contains('External Collaborators')
    cy.get('#external-collaborators-span').should('exist').contains('Person A, Person B')
  })

  it('renders a list of internal collaborators', () => {
    const props = {
      internalCollaborators: [{ name: 'Person C' }, { name: 'Person D' }],
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#internal-collaborators-label').should('exist').contains('Internal Collaborators')
    cy.get('#internal-collaborators-span').should('exist').contains('Person C, Person D')
  })

  it('renders a list of internal lab staff', () => {
    const props = {
      internalLabStaff: [{ name: 'Person E' }, { name: 'Person F' }],
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#internal-lab-staff-label').should('exist').contains('Internal Lab Staff')
    cy.get('#internal-lab-staff-span').should('exist').contains('Person E, Person F')
  })

  it('renders the signing official and signing official', () => {
    const props = {
      signingOfficialEmail: 'test@test.com',
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#signing-official-label').should('exist').contains('Signing Official')
    cy.get('#signing-official-span').should('exist').contains('test@test.com')
  })

  it('renders the IT director and IT director', () => {
    const props = {
      itDirectorEmail: 'test@test.com',
    }
    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#it-director-label').should('exist').contains('IT Director')
    cy.get('#it-director-span').should('exist').contains('test@test.com')
  })

  it('renders AnVIL storage information', () => {
    const props = {
      anvilStorage: true,
    }

    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#anvil-storage-span').should('exist').contains('Yes')
    cy.get('#anvil-storage-label').should('exist').contains('Using AnVIL only for storage and analysis')
  })

  it('renders expected document links', () => {
    const props = {
      collaborationLetterLocation: 'some-other-uuid',
      referenceId: 'dar-uuid',
      collaborationLetterName: 'collab-letter.txt',
    }

    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#collab-letter').should('exist').contains('Download Collaboration Letter')
  })

  it('doesnt render a missing document link', () => {
    const props = {
      collaborationLetterLocation: 'some-other-uuid',
      referenceId: 'dar-uuid',
      collaborationLetterName: 'collab-letter.txt',
    }

    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#irb-doc').should('not.exist')
    cy.get('#collab-letter').should('exist').contains('Download Collaboration Letter')
  })

  it('doesnt render without referenceId', () => {
    const props = {
      irbDocumentLocation: 'some-uuid',
      collaborationLetterLocation: 'some-other-uuid',
      irbDocumentName: 'irbdoc.txt',
      collaborationLetterName: 'collab-letter.txt',
    }

    cy.mount(<ApplicationInformation {...props} />)
    cy.get('#irb-doc').should('not.exist')
    cy.get('#collab-letter').should('not.exist')
  })
})
