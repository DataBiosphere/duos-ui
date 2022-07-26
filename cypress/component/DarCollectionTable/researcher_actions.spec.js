/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import ResearcherActions from '../../../src/components/dar_collection_table/ResearcherActions';


const draftDarColl = {
  "darCollectionId": null,
  "referenceIds": [
    '0a4jn-g838d-bsdg8-6s7fs7',
  ],
  "darCode": "DRAFT-023",
  "name": null,
  "submissionDate": "2022-07-26",
  "researcherName": null,
  "institutionName": null,
  "status": "Draft",
  "actions": [
    "Resume",
  ],
  "hasVoted": false,
  "datasetCount": 10
}

const darColl = {
  "darCollectionId": 2345,
  "referenceIds": [
    '4a3fd-g77fd-2f345-4h2g31',
    '0a4jn-g838d-bsdg8-6s7fs7',
  ],
  "darCode": "DAR-9583",
  "name": "Example DAR 1",
  "submissionDate": "2022-07-26",
  "researcherName": "John Doe",
  "institutionName": "Broad Institute",
  "status": "Draft",
  "actions": [
    "Review",
    "Cancel",
  ],
  "hasVoted": false,
  "datasetCount": 4
}

let props;

const initialProps = {
  collection: darColl,
  showConfirmationModal: () => {},
  history: {}
};

beforeEach(() => {
  props = cloneDeep(initialProps);
});


describe('Researcher Actions - Container', () => {
  it('renders the actions container div', () => {
    mount(<ResearcherActions {...props}/>);
    cy.get('.researcher-actions').should('exist');
  });
});

describe('Researcher Actions - Cancel Button', () => {
  it('renders the cancel button if the collection is cancelable', () => {
    props.collection.actions = ['Cancel', 'Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-cancel-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is already canceled', () => {
    props.collection.actions = ['Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-cancel-${props.collection.darCollectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Revise Button', () => {
  it('renders the revise button if the collection is revisable', () => {
    props.collection.actions = ['Revise', 'Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#revise-collection-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is not revisable', () => {
    props.collection.actions = ['Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#revise-collection-${props.collection.darCollectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Review Button', () => {
  it('renders the review button if the collection is reviewable', () => {
    props.collection.actions = ['Revise', 'Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-review-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is not reviewable', () => {
    props.collection.actions = ['Revise'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-review-${props.collection.darCollectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Resume Button', () => {
  it('renders the resume button if the collection is resumable', () => {
    props.collection.actions = ['Resume', 'Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-resume-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is not resumable', () => {
    props.collection.actions = ['Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-resume-${props.collection.darCollectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Delete Button', () => {
  it('renders the delete button if the collection is deletable', () => {
    props.collection.actions = ['Delete', 'Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-delete-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is not deletable', () => {
    props.collection.actions = ['Review'];
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-delete-${props.collection.darCollectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Draft', () => {
  it('uses the referenceId in id if draft', () => {
    props.collection = draftDarColl;
    props.collection.actions = ['Revise', 'Resume', 'Review', 'Cancel', 'Delete']
    mount(<ResearcherActions {...props} />);
    cy.get(`#researcher-resume-${props.collection.referenceIds[0]}`).should('exist');
    cy.get(`#researcher-review-${props.collection.referenceIds[0]}`).should('exist');
    cy.get(`#researcher-cancel-${props.collection.referenceIds[0]}`).should('exist');
    cy.get(`#researcher-delete-${props.collection.referenceIds[0]}`).should('exist');
    cy.get(`#revise-collection-${props.collection.referenceIds[0]}`).should('exist');
  });

});
