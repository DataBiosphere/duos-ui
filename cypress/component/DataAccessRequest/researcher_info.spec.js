/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from 'cypress/react';
import ResearcherInfo from '../../../src/pages/dar_application/ResearcherInfo';
import { User } from '../../../src/libs/ajax/User';

import {BrowserRouter} from 'react-router-dom';

const props = {
  allSigningOfficials: [],
  completed: true,
  darCode: undefined,
  eRACommonsDestination: undefined,
  formFieldChange: () => {},
  invalidResearcher: false,
  location: undefined,
  onNihStatusUpdate: () => {},
  partialSave: () => {},
  setLabCollaboratorsCompleted: () => {},
  setInternalCollaboratorsCompleted: () => {},
  setExternalCollaboratorsCompleted: () => {},
  researcher: {},
  showValidationMessages: false,
  nextPage: () => {},
  validation: {},
  formValidationChange: () => {},
  formData: {
    cloudProviderType: '',
    cloudProvider: '',
    cloudProviderDescription: '',
    internalCollaborators: [],
    externalCollaborators: [],
    labCollaborators: [],
  }
};

const researcherWithLibraryCards = {
  libraryCards: [
    {
      'id': 1,
      'userId': 1,
      'institutionId': 150,
      'eraCommonsId': 'user',
      'userName': 'User',
      'userEmail': 'email',
      'institution': {
        'id': 150,
        'name': 'The Broad Institute of MIT and Harvard',
      }
    }
  ]
};

const addNewCollaborator = (collaboratorType) => {
  cy.get(`[data-cy=${collaboratorType}]`)
    .find('.collaborator-list-component')
    .find('.row')
    .find('.button').click();
  cy.get('#0_collaboratorName').type('John Doe{enter}');
  cy.get('#0_collaboratorEraCommonsId').type('12345{enter}');
  cy.get('#0_collaboratorTitle').type('Analyst{enter}');
  cy.get('#0_collaboratorEmail').type('JohnDoe@gmail.com{enter}');
};

// It's necessary to wrap this component because it contains `Link` components
const WrappedResearcherInfo = (props) => {
  return <BrowserRouter>
    <ResearcherInfo {...props}/>
  </BrowserRouter>;
};

const user = {
  userId: 1,
  displayName: 'Cindy Crawford',
  email: 'cc@c.com'
};

beforeEach(() => {
  cy.stub(User, 'getMe').returns(user);
});

describe('Researcher Info', () => {
  it('renders the researcher info component', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[data-cy=researcher-info]').should('be.visible');
  });

  it('renders the missing library cards alert correctly', () => {
    const mergedProps = {...props, ...{formData: {...props.formData }}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[data-cy=researcher-info-profile-unsubmitted]').should('not.exist');
    cy.get('[data-cy=researcher-info-profile-submitted]').should('be.visible');
  });

  it('renders the profile submitted alert', () => {
    const mergedProps = {...props, ...{completed: true, researcher: researcherWithLibraryCards}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[data-cy=researcher-info-profile-submitted]').should('be.visible');
    cy.get('[data-cy=researcher-info-profile-unsubmitted]').should('not.exist');
  });

  it('renders the profile unsubmitted alert', () => {
    const mergedProps = {...props, ...{completed: false, researcher: researcherWithLibraryCards}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[data-cy=researcher-info-profile-unsubmitted]').should('be.visible');
    cy.get('[data-cy=researcher-info-profile-submitted]').should('be.visible');
  });

  it('renders the internal lab staff button and form', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
  });

  it('renders the internal collaborator button and form', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[data-cy=internal-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    cy.get('[data-cy=internal-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
  });

  it('renders the external collaborator button and form', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[data-cy=external-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    cy.get('[data-cy=external-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
  });

  it('saves new collaborators properly', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    addNewCollaborator('internal-lab-staff');
    cy.get('#0_collaboratorApproval_yes').check();
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('#0_summary').should('exist');
    cy.get('#0_name').should('have.text', 'John Doe');
    cy.get('#0_title').should('have.text', 'Analyst');
    cy.get('#0_eraCommonsId').should('have.text', '12345');
    cy.get('#0_email').should('have.text', 'JohnDoe@gmail.com');
  });

  it('deletes saved collaborators properly', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    addNewCollaborator('internal-lab-staff');
    cy.get('#0_collaboratorApproval_yes').check();
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('#0_deleteMember').click();
    // cy.get('#0_confirmDeleteMember').click();
    // cy.get('#0_summary').should('not.exist');
  });

  it('cancels adding new collaborators properly', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    addNewCollaborator('internal-lab-staff');
    cy.get('#0_collaboratorApproval_yes').check();
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-cancel-button').click();
    cy.get('#0_summary').should('not.exist');
  });

  it('updates collaborator properly', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    addNewCollaborator('internal-lab-staff');
    cy.get('#0_collaboratorApproval_yes').check();
    // save collaborator and switch to summary view
    cy.get('.collaborator-form-add-save-button').click();
    // edit and switch to form view
    cy.get('#0_editCollaborator').click();
    cy.get('#0_summary').should('not.exist');
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
    // update the collaborator name
    cy.get('#0_collaboratorName').clear();
    cy.get('#0_collaboratorName').type('Jane Doe{enter}');
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('#0_summary').should('exist');
    cy.get('#0_name').should('have.text', 'Jane Doe');
    // also check the delete button on the edit form
    cy.get('#0_editCollaborator').click();
    cy.get('#0_deleteMember').click();
    cy.get('.delete-modal-primary-button').click();
    cy.get('#0_summary').should('not.exist');
    cy.get('[data-cy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('not.exist');
  });
});
