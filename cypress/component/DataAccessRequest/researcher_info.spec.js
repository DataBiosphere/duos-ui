/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from '@cypress/react';
import ResearcherInfo from '../../../src/pages/dar_application/ResearcherInfo.js';
import {BrowserRouter} from 'react-router-dom';

const props = {
  allSigningOfficials: [],
  completed: true,
  darCode: 'DAR-123',
  cloudProviderDescription: '',
  eRACommonsDestination: '',
  externalCollaborators: [],
  formFieldChange: () => {},
  internalCollaborators: [],
  invalidInvestigator: false,
  invalidResearcher: false,
  investigator: '',
  labCollaborators: [],
  linkedIn: '',
  location: '',
  nihValid: true,
  onNihStatusUpdate: () => {},
  orcid: '',
  partialSave: () => {},
  researcher: '',
  researcherUser: {},
  researcherGate: '',
  showValidationMessages: false,
  nextPage: () => {},
  cloudProviderType: '',
  cloudProvider: '',
  isCloudUseInvalid: false,
  isCloudProviderInvalid: false,
  isAnvilUseInvalid: false
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
});
