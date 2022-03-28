/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from '@cypress/react';
import ResearcherInfo from '../../../src/pages/dar_application/ResearcherInfo.js';
import {BrowserRouter} from "react-router-dom";

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
});
