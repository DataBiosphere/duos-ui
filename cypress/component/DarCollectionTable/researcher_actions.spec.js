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
    data: {},
    elections: {
      1: { status: 'Open' }
    }
  },
  2: {
    data: {},
    elections: {
      2: { status: 'Closed' }
    }
  }
};

const darsWithNoElections = {
  1: {
    data: {},
    elections: {}
  },
  2: {
    data: {},
    elections: {}
  }
};

const mixedCancelElectionDars = {
  1: {
    data: {
      status: 'Canceled'
    },
    elections: {
      1: { status: 'Closed'}
    }
  },
  2: {
    data: {
      status: 'Canceled'
    }
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
    cy.get('.researcher-actions').should('exist');
  });
});

describe('Researcher Actions - Cancel Button', () => {
  it('renders the cancel button if the collection is cancelable', () => {
    propCopy.collection.dars = darsWithNoElections;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-cancel-${collectionId}`).should('exist');
  });
  it('does not render if the election is already canceled', () => {
    propCopy.collection.dars = canceledDars;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-cancel-${collectionId}`).should('not.exist');
  });
  it('does not render cancel button is collection has elections on it', () => {
    propCopy.collection.dars = darsWithElections;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-cancel-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Revise Button', () => {
  it('renders the revise button if all of the DARs are cancelled', () => {
    propCopy.collection.dars = canceledDars;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#revise-collection-${collectionId}`).should('exist');
  });

  it('does not render the revise button if there are elections present', () => {
    propCopy.collection.dars = mixedCancelElectionDars;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#revise-collection-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Review Button', () => {
  it('renders the review button if the DAR has been submitted', () => {
    propCopy.collection.dars = darsWithElections;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-review-${collectionId}`).should('exist');
  });

  it('hides the review button if the collection is in draft status', () => {
    propCopy.collection.isDraft = true;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-review-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Resume Button', () => {
  it('renders the resume button if the collection is in draft status', () => {
    propCopy.collection.dars = canceledDars;
    propCopy.collection.isDraft = true;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-resume-${collectionId}`).should('exist');
  });

  it('hides the resume button if the collection is not in draft status', () => {
    propCopy.collection.dars = {1: {data: {}}};
    propCopy.collection.isDraft = false;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-resume-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Cancel Button', () => {
  it('renders the cancel button if the collection is not in draft status', () => {
    propCopy.collection.dars = darsWithNoElections;
    propCopy.collection.isDraft = false;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-cancel-${collectionId}`).should('exist');
  });

  it('hides the cancel button if the collection is in draft status', () => {
    propCopy.collection.dars = darsWithNoElections;
    propCopy.collection.isDraft = true;
    mount(<ResearcherActions {...propCopy} />);
    cy.get(`#researcher-cancel-${collectionId}`).should('not.exist');
  });

  it('hides the cancel button if the collection already has elections created', () => {
    it('hides the cancel button if the collection is in draft status', () => {
      propCopy.collection.dars = darsWithElections;
      propCopy.collection.isDraft = true;
      mount(<ResearcherActions {...propCopy} />);
      cy.get(`#researcher-cancel-${collectionId}`).should('not.exist');
    });
  });
});
