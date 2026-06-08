import { React, useEffect, useState } from 'react'
import ResearcherInfo from 'src/pages/dar_application/ResearcherInfo'
import { User } from 'src/libs/ajax/User.js'

import { BrowserRouter } from 'react-router-dom'

const props = {
  allSigningOfficials: [],
  countriesOfOperation: ['United States of America (the)', 'France', 'Canada'],
  darCode: undefined,
  eRACommonsDestination: undefined,
  formFieldChange: () => {},
  onNihStatusUpdate: () => {},
  setLabCollaboratorsCompleted: () => {},
  setInternalCollaboratorsCompleted: () => {},
  setExternalCollaboratorsCompleted: () => {},
  researcher: { displayName: 'Researcher Name', email: 'name@email.com' },
  showValidationMessages: false,
  validation: {},
  formValidationChange: () => {},
  formData: {
    cloudProviderType: '',
    cloudProvider: '',
    cloudProviderDescription: '',
    internalCollaborators: [],
    externalCollaborators: [],
    labCollaborators: [],
    piName: 'PI Name',
    piEmail: 'pi@email.com',
  },
}

const researcherWithLibraryCard = {
  libraryCard: {
    id: 1,
    userId: 1,
    institutionId: 150,
    eraCommonsId: 'user',
    userName: 'User',
    userEmail: 'email',
    institution: {
      id: 150,
      name: 'The Broad Institute of MIT and Harvard',
    },
  },
}

const addNewCollaborator = (collaboratorType) => {
  cy.get(`[data-cy=${collaboratorType}]`)
    .find('.collaborator-list-component')
    .find('.row')
    .find('.button').click()
  cy.get('#0_collaboratorName').type('John Doe{enter}')
  cy.get('#0_collaboratorEraCommonsId').type('12345{enter}')
  cy.get('#0_collaboratorTitle').type('Analyst{enter}')
  cy.get('#0_collaboratorEmail').type('JohnDoe@gmail.com{enter}')
}

// It's necessary to wrap this component because it contains `Link` components
const WrappedResearcherInfo = (props) => {
  return (
    <BrowserRouter>
      <ResearcherInfo {...props} />
    </BrowserRouter>
  )
}

const user = {
  userId: 1,
  displayName: 'Cindy Crawford',
  email: 'cc@c.com',
}

beforeEach(() => {
  cy.stub(User, 'getMe').returns(user)
})

describe('Researcher Info', () => {
  it('renders the researcher info component', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    cy.get('[data-cy=researcher-info]').should('be.visible')
  })

  it('does not show the library card warning before async researcher load completes', () => {
    cy.clock()
    cy.mount(<AsyncResearcherWrapper {...props} />)

    cy.get('[data-cy=researcher-info-library-card-required]').should('not.exist')

    cy.tick(50)
    cy.get('[data-cy=researcher-info-library-card-required]').should('be.visible')
  })

  it('renders the library card required alert when researcher has no library card', () => {
    const mergedProps = { ...props, ...{ formData: { ...props.formData } } }
    cy.mount(<WrappedResearcherInfo {...mergedProps} />)
    cy.get('[data-cy=researcher-info-library-card-required]').should('be.visible')
  })

  it('does not render the library card required alert when researcher has a library card', () => {
    const mergedProps = { ...props, researcher: researcherWithLibraryCard }
    cy.mount(<WrappedResearcherInfo {...mergedProps} />)
    cy.get('[data-cy=researcher-info-library-card-required]').should('not.exist')
  })

  it('hides the alert content inside the library card required section in read-only mode', () => {
    const mergedProps = { ...props, readOnlyMode: true }
    cy.mount(<WrappedResearcherInfo {...mergedProps} />)
    cy.get('[data-cy=researcher-info-library-card-required]').should('exist')
    cy.get('[data-cy=researcher-info-library-card-required]').find('[id=libraryCardRequired]').should('not.exist')
  })

  it('renders the internal lab staff button and form', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click()
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist')
  })

  it('renders the internal collaborator button and form', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    cy.get('[data-cy=internal-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click()
    cy.get('[data-cy=internal-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist')
  })

  it('renders the external collaborator button and form', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    cy.get('[data-cy=external-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click()
    cy.get('[data-cy=external-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist')
  })

  it('saves new collaborators properly', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    addNewCollaborator('internal-lab-staff')
    cy.get('#0_collaboratorApproval_true').check()
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-add-save-button').click()
    cy.get('#0_summary').should('exist')
    cy.get('#0_name').should('have.text', 'John Doe')
    cy.get('#0_title').should('have.text', 'Analyst')
    cy.get('#0_eraCommonsId').should('have.text', '12345')
    cy.get('#0_email').should('have.text', 'JohnDoe@gmail.com')
  })

  it('deletes saved collaborators properly', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    addNewCollaborator('internal-lab-staff')
    cy.get('#0_collaboratorApproval_true').check()
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-add-save-button').click()
    cy.get('#0_deleteMember').click()
    // cy.get('#0_confirmDeleteMember').click();
    // cy.get('#0_summary').should('not.exist');
  })

  it('cancels adding new collaborators properly', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    addNewCollaborator('internal-lab-staff')
    cy.get('#0_collaboratorApproval_true').check()
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-cancel-button').click()
    cy.get('#0_summary').should('not.exist')
  })

  it('updates collaborator properly', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    addNewCollaborator('internal-lab-staff')
    cy.get('#0_collaboratorApproval_true').check()
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-add-save-button').click()
    // edit and switch to form view
    cy.get('#0_editCollaborator').click()
    cy.get('#0_summary').should('not.exist')
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist')
    // update the collaborator name
    cy.get('#0_collaboratorName').clear()
    cy.get('#0_collaboratorName').type('Jane Doe{enter}')
    cy.get('.collaborator-form-add-save-button').click()
    cy.get('#0_summary').should('exist')
    cy.get('#0_name').should('have.text', 'Jane Doe')
    // also check the delete button on the edit form
    cy.get('#0_editCollaborator').click()
    cy.get('#0_deleteMember').click()
    cy.get('.delete-modal-primary-button').click()
    cy.get('#0_summary').should('not.exist')
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('not.exist')
  })

  it('renders researcher and pi as disabled with pi fields populated with the researcher data when not in read only mode', () => {
    cy.mount(<WrappedResearcherInfo {...props} />)
    cy.get('#researcherName').should('have.value', props.researcher.displayName)
    cy.get('#piName').should('have.value', props.researcher.displayName)
    cy.get('#piEmail').should('have.value', props.researcher.email)
  })

  it('renders researcher and pi as disabled with pi fields populated with saved pi info in read only mode', () => {
    const mergedProps = { ...props, ...{ readOnlyMode: true, eraCommonsId: 'scoobydoo' } }
    cy.mount(<WrappedResearcherInfo {...mergedProps} />)
    cy.get('#researcherName').should('have.value', props.researcher.displayName)
    cy.get('#piName').should('have.value', props.formData.piName)
    cy.get('#piEmail').should('have.value', props.formData.piEmail)
    cy.get('[data-cy=era-commons-display-id-value]').should('have.text', 'scoobydoo')
  })
})

const AsyncResearcherWrapper = (props) => {
  const [asyncResearcher, setAsyncResearcher] = useState({})

  useEffect(() => {
    const timer = setTimeout(() => {
      setAsyncResearcher({ displayName: 'Researcher Name', email: 'name@email.com' })
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  return (
    <BrowserRouter>
      <ResearcherInfo {...props} researcher={asyncResearcher} />
    </BrowserRouter>
  )
}
