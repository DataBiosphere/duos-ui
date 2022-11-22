/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from 'cypress/react';
import ResearcherInfo from '../../../src/pages/dar_application/ResearcherInfo_new.js';
import {BrowserRouter} from 'react-router-dom';

const props = {
  allSigningOfficials: [],
  completed: true,
  darCode: undefined,
  cloudProviderDescription: '',
  eRACommonsDestination: undefined,
  externalCollaborators: [],
  formFieldChange: () => {},
  internalCollaborators: [],
  invalidResearcher: false,
  labCollaborators: [],
  location: undefined,
  nihValid: true,
  onNihStatusUpdate: () => {},
  partialSave: () => {},
  researcher: '',
  researcherUser: {},
  showValidationMessages: false,
  nextPage: () => {},
  cloudProviderType: '',
  cloudProvider: '',
  isCloudUseInvalid: false,
  isCloudProviderInvalid: false,
  isAnvilUseInvalid: false,
};

const researcherUserWithLibraryCards = {
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
  cy.get(`[dataCy=${collaboratorType}]`)
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

describe('Researcher Info', () => {
  it('renders the researcher info component', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[dataCy=researcher-info]').should('be.visible');
  });

  it('renders the missing library cards alert correctly', () => {
    const mergedProps = {...props, ...{checkNihDataOnly: false}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[dataCy=researcher-info-missing-library-cards]').should('be.visible');
    cy.get('[dataCy=researcher-info-profile-unsubmitted]').should('not.exist');
    cy.get('[dataCy=researcher-info-profile-submitted]').should('not.exist');
  });

  it('renders the profile submitted alert', () => {
    const mergedProps = {...props, ...{completed: true, researcherUser: researcherUserWithLibraryCards}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[dataCy=researcher-info-profile-submitted]').should('be.visible');
    cy.get('[dataCy=researcher-info-profile-unsubmitted]').should('not.exist');
    cy.get('[dataCy=researcher-info-missing-library-cards]').should('not.exist');
  });

  it('renders the profile submitted alert for researcher without library cards if only NIH data requested', () => {
    const mergedProps = {...props, ...{completed: true, checkNihDataOnly: true}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[dataCy=researcher-info-profile-submitted]').should('be.visible');
    cy.get('[dataCy=researcher-info-profile-unsubmitted]').should('not.exist');
    cy.get('[dataCy=researcher-info-missing-library-cards]').should('not.exist');
  });

  it('renders the profile unsubmitted alert', () => {
    const mergedProps = {...props, ...{completed: false, researcherUser: researcherUserWithLibraryCards}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[dataCy=researcher-info-profile-unsubmitted]').should('be.visible');
    cy.get('[dataCy=researcher-info-profile-submitted]').should('not.exist');
    cy.get('[dataCy=researcher-info-missing-library-cards]').should('not.exist');
  });

  it('renders the profile unsubmitted alert for researcher without library cards if only NIH data requested', () => {
    const mergedProps = {...props, ...{completed: false, checkNihDataOnly: true}};
    mount(<WrappedResearcherInfo {...mergedProps}/>);
    cy.get('[dataCy=researcher-info-profile-unsubmitted]').should('be.visible');
    cy.get('[dataCy=researcher-info-profile-submitted]').should('not.exist');
    cy.get('[dataCy=researcher-info-missing-library-cards]').should('not.exist');
  });

  it('renders the internal lab staff button and form', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[dataCy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    cy.get('[dataCy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
  });

  it('renders the internal collaborator button and form', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[dataCy=internal-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    cy.get('[dataCy=internal-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
  });

  it('renders the external collaborator button and form', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get('[dataCy=external-collaborators]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    cy.get('[dataCy=external-collaborators]')
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
    cy.get('#0_summary').should('not.exist');
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
    cy.get('[dataCy=internal-lab-staff]')
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
    cy.get('#0_summary').should('not.exist');
    cy.get('[dataCy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('not.exist');
  });

  it('validates collaborator form values properly', () => {
    mount(<WrappedResearcherInfo {...props}/>);
    cy.get(`[dataCy='internal-lab-staff']`)
      .find('.collaborator-list-component')
      .find('.row')
      .find('.button').click();
    // no values entered, should have 5 errors
    cy.get('.collaborator-form-add-save-button').click();
    // should not save without all fields
    cy.get('#0_summary').should('not.exist');
    cy.get('[dataCy=internal-lab-staff]')
      .find('.collaborator-list-component')
      .find('.row')
      .find('.form-group').should('exist');
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.length', 5);
    // Download/Approval status not entered
    cy.get('#0_collaboratorName').type('John Doe{enter}');
    cy.get('#0_collaboratorEraCommonsId').type('12345{enter}');
    cy.get('#0_collaboratorTitle').type('Analyst{enter}');
    cy.get('#0_collaboratorEmail').type('JohnDoe@gmail.com{enter}');
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.text', 'Must specify the Designated Download/Approval status.');
    // name not entered
    cy.get('#0_collaboratorName').clear();
    cy.get('#0_collaboratorApproval_yes').check();
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.text', 'Must specify the name of the collaborator.');
    // EraCommonsId not entered
    cy.get('#0_collaboratorName').type('John Doe{enter}');
    cy.get('#0_collaboratorEraCommonsId').clear();
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.text', 'Must specify the eRA Commons ID of the collaborator.');
    // Title not entered
    cy.get('#0_collaboratorEraCommonsId').type('12345{enter}');
    cy.get('#0_collaboratorTitle').clear();
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.text', 'Must specify the title of the collaborator.');
    // Email not entered
    cy.get('#0_collaboratorTitle').type('Analyst{enter}');
    cy.get('#0_collaboratorEmail').clear();
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.text', 'Must specify the email of the collaborator.');
    // Invalid Email entered
    cy.get('#0_collaboratorEmail').type('JohnDoe@gmail{enter}');
    cy.get('.collaborator-form-add-save-button').click();
    cy.get('[dataCy=collaborator-form-errors]').children().should('have.text', 'Please enter a valid email address (e.g., person@example.com)');
  });
});
