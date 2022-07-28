/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react';
import Actions from '../../../src/components/dar_collection_table/Actions';
import {cloneDeep} from 'lodash/fp';
import { Navigation } from '../../../src/libs/utils';
import { Storage } from '../../../src/libs/storage';

let propCopy;
const collectionId = 1;

const darColl = {
  'darCollectionId': collectionId,
  'referenceIds': [
    '4a3fd-g77fd-2f345-4h2g31',
    '0a4jn-g838d-bsdg8-6s7fs7',
  ],
  'darCode': 'DAR-9583',
  'name': 'Example DAR 1',
  'submissionDate': '2022-07-26',
  'researcherName': 'John Doe',
  'institutionName': 'Broad Institute',
  'status': 'Draft',
  'actions': [
    'Review',
    'Cancel',
  ],
  'hasVoted': false,
  'datasetCount': 4
};

const draftDarColl = {
  'darCollectionId': null,
  'referenceIds': [
    '0a4jn-g838d-bsdg8-6s7fs7',
  ],
  'darCode': 'DRAFT-023',
  'name': null,
  'submissionDate': '2022-07-26',
  'researcherName': null,
  'institutionName': null,
  'status': 'Draft',
  'actions': [
    'Resume',
  ],
  'hasVoted': false,
  'datasetCount': 10
};

const user = {
  userId: 1,
  roles: [
    {
      dacId: 2
    },
    {}, //not all roles are tied to a DAC, this is a stub for those roles
    {
      dacId: 3
    }
  ]
};

const props = {
  consoleType: 'chair',
  collection: darColl,
  showCancelModal: () => {},
  updateCollections: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
  cy.stub(Navigation, 'console').returns({});
  cy.stub(Storage, 'getCurrentUser').returns(user);
});

describe('Actions - Container', () => {
  it('renders the actions container div', () => {
    mount(<Actions {...propCopy}/>);
    const container = cy.get('.chair-actions');
    container.should('exist');
  });
});

describe('Actions - Open Button', () => {
  it('should render the open button if there is a an Open Action', () => {
    propCopy.actions = ['Open'];
    mount(<Actions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('exist');
  });

  it('should not render Open Button if there is no valid election for opening/re-opening', () => {
    propCopy.actions = [];
    mount(<Actions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('not.exist');
  });
});

describe('Actions - Close Button', () => {
  it('should render if there is a valid election for canceling (all open elections)', () => {
    propCopy.actions = ['Cancel', 'Vote'];
    mount(<Actions {...propCopy} />);
    const closeButton = cy.get(`#chair-cancel-${collectionId}`);
    closeButton.should('exist');
  });

  it('should not render if there is no valid election for canceling (no open elections)', () => {
    propCopy.actions = [];
    mount(<Actions {...propCopy} />);
    const closeButton = cy.get(`#chair-cancel-${collectionId}`);
    closeButton.should('not.exist');
  });
});

describe('Actions - Vote Button', () => {
  it('should not render if relevant elections are not votable', () => {
    propCopy.actions = [];
    mount(<Actions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('not.exist');
  });
  it('should render if all relevant elections are votable', () => {
    propCopy.actions = ['Vote'];
    mount(<Actions {...propCopy} />);
    const voteButton = cy.get(`#chair-vote-${collectionId}`);
    voteButton.should('exist');
  });
});

describe('Actions - Update Button', () => {
  it('should not render if relevant elections are not votable', () => {
    propCopy.actions = [];
    mount(<Actions {...propCopy} />);
    const voteButton = cy.get(`#chair-update-${collectionId}`);
    voteButton.should('not.exist');
  });
  it('should render if all relevant elections are votable', () => {
    propCopy.actions = ['Update'];
    mount(<Actions {...propCopy} />);
    const voteButton = cy.get(`#chair-update-${collectionId}`);
    voteButton.should('exist');
  });


  describe('Researcher Actions - Revise Button', () => {
    it('renders the revise button if the collection is revisable', () => {
      props.collection.actions = ['Revise', 'Review'];
      mount(<Actions {...props} />);
      cy.get(`#revise-collection-${props.collection.darCollectionId}`).should('exist');
    });
    it('does not render if the election is not revisable', () => {
      props.collection.actions = ['Review'];
      mount(<Actions {...props} />);
      cy.get(`#revise-collection-${props.collection.darCollectionId}`).should('not.exist');
    });
  });

  describe('Researcher Actions - Review Button', () => {
    it('renders the review button if the collection is reviewable', () => {
      props.collection.actions = ['Revise', 'Review'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-review-${props.collection.darCollectionId}`).should('exist');
    });
    it('does not render if the election is not reviewable', () => {
      props.collection.actions = ['Revise'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-review-${props.collection.darCollectionId}`).should('not.exist');
    });
  });

  describe('Researcher Actions - Resume Button', () => {
    it('renders the resume button if the collection is resumable', () => {
      props.collection.actions = ['Resume', 'Review'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-resume-${props.collection.darCollectionId}`).should('exist');
    });
    it('does not render if the election is not resumable', () => {
      props.collection.actions = ['Review'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-resume-${props.collection.darCollectionId}`).should('not.exist');
    });
  });

  describe('Researcher Actions - Delete Button', () => {
    it('renders the delete button if the collection is deletable', () => {
      props.collection.actions = ['Delete', 'Review'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-delete-${props.collection.darCollectionId}`).should('exist');
    });
    it('does not render if the election is not deletable', () => {
      props.collection.actions = ['Review'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-delete-${props.collection.darCollectionId}`).should('not.exist');
    });
  });

  describe('Researcher Actions - Draft', () => {
    it('uses the referenceId in id if draft', () => {
      props.collection = draftDarColl;
      props.collection.actions = ['Revise', 'Resume', 'Review', 'Cancel', 'Delete'];
      mount(<Actions {...props} />);
      cy.get(`#researcher-resume-${props.collection.referenceIds[0]}`).should('exist');
      cy.get(`#researcher-review-${props.collection.referenceIds[0]}`).should('exist');
      cy.get(`#researcher-cancel-${props.collection.referenceIds[0]}`).should('exist');
      cy.get(`#researcher-delete-${props.collection.referenceIds[0]}`).should('exist');
      cy.get(`#revise-collection-${props.collection.referenceIds[0]}`).should('exist');
    });
  });

});

