/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react';
import { cloneDeep } from 'lodash/fp';
import AdminActions from '../../../src/components/dar_collection_table/AdminActions';

const darColl = {
  'darCollectionId': 2345,
  'referenceIds': [
    '4a3fd-g77fd-2f345-4h2g31',
    '0a4jn-g838d-bsdg8-6s7fs7',
  ],
  'darCode': "DAR-9583",
  'name': 'Example DAR 1',
  'submissionDate': '2022-07-26',
  'researcherName': 'John Doe',
  'institutionName': 'Broad Institute',
  "status": "Draft",
  'actions': [
    'Review',
    'Cancel',
  ],
  'hasVoted': false,
  'datasetCount': 4
};

let props;

const initialProps = {
  collection: darColl,
  showConfirmationModal: () => {},
  history: {}
};

beforeEach(() => {
  props = cloneDeep(initialProps);
});


describe('Admin Actions - Container', () => {
  it('renders the actions container div', () => {
    mount(<AdminActions {...props}/>);
    cy.get('.admin-actions').should('exist');
  });
});

describe('Admin Actions - Cancel Button', () => {
  it('renders the cancel button if the collection is cancelable', () => {
    props.collection.actions = ['Cancel'];
    mount(<AdminActions {...props} />);
    cy.get(`#admin-cancel-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is already canceled', () => {
    props.collection.actions = [];
    mount(<AdminActions {...props} />);
    cy.get(`#admin-cancel-${props.collection.darCollectionId}`).should('not.exist');
  });
});

describe('Admin Actions - Open Button', () => {
  it('renders the open button if the collection is openable', () => {
    props.collection.actions = ['Open'];
    mount(<AdminActions {...props} />);
    cy.get(`#admin-open-${props.collection.darCollectionId}`).should('exist');
  });
  it('does not render if the election is already opened', () => {
    props.collection.actions = [];
    mount(<AdminActions {...props} />);
    cy.get(`#admin-open-${props.collection.darCollectionId}`).should('not.exist');
  });
});
