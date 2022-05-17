/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from '@cypress/react';
import { cloneDeep } from 'lodash/fp';
import ResearcherActions from '../../../src/components/dar_collection_table/ResearcherActions';

let propCopy;
const collectionId = 1;
const collectionSkeleton = {
  darCollectionId: collectionId,
  dars: undefined,
};

const canceledDars = {
  1: {
    data: {
      status: 'Canceled'
    }
  },
  2: {
    data: {
      status: 'Canceled'
    }
  }
};

const darsWithElections = {
  1: {
    elections: {
      1: { data: {status: 'Open' } }
    }
  },
  2: {
    elections: {
      2: { data: {status: 'Closed'} }
    }
  }
};

const darsWithNoElections = {
  1: {
    elections: {}
  },
  2: {
    elections: {}
  }
};

const props = {
  collection: collectionSkeleton,
  showConfirmationModal: () => {},
  history: {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
});

describe('Researcher Actions - Container', () => {
  it('renders the actions container div', () => {
    propCopy.collection.dars = canceledDars;
    mount(<ResearcherActions {...propCopy}/>);
    const container = cy.get('.researcher-actions');
    container.should('exist');
  });
});

describe('Researcher Actions - Cancel Button', () => {
  it('renders the cancel button if the collection is cancelable', () => {
    propCopy.collection.dars = darsWithNoElections;
    mount(<ResearcherActions {...propCopy} />);
    const cancelButton = cy.get(`#researcher-cancel-${collectionId}`);
    cancelButton.should('exist');
  });
  it('does not render if the election is already canceled', () => {
    propCopy.collection.dars = canceledDars;
    mount(<ResearcherActions {...propCopy} />);
    const cancelButton = cy.get(`#researcher-cancel-${collectionId}`);
    cancelButton.should('not.exist');
  });
  it('does not render cancel button is collection has elections on it', () => {
    propCopy.collection.dars = darsWithElections;
    mount(<ResearcherActions {...propCopy} />);
    const cancelButton = cy.get(`#researcher-cancel-${collectionId}`);
    cancelButton.should('not.exist');
  });
});

describe('Researcher Actions - Review Button', () => {
  it('renders the review action button', () => {
    propCopy.collection.dars = canceledDars;
    mount(<ResearcherActions {...propCopy} />);
    const reviewButton = cy.get(`#researcher-review-${collectionId}`);
    reviewButton.should('exist');
  });
});

describe('Researcher Actions - Revise Button', () => {
  it('renders the resubmit button if all of the DARs are cancelled', () => {
    propCopy.collection.dars = canceledDars;
    mount(<ResearcherActions {...propCopy} />);
    const resubmitButton = cy.get(`#resubmit-collection-${collectionId}`);
    resubmitButton.should('exist');
  });

  it('does not render the resubmit button if there are open elections present', () => {
    propCopy.collection.dars = darsWithElections;
    mount(<ResearcherActions {...propCopy} />);
    const resubmitButton = cy.get(`#resubmit-collection-${collectionId}`);
    resubmitButton.should('not.exist');
  });
});
