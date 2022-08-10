/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react';
import Actions from '../../../src/components/dar_collection_table/Actions';
import {cloneDeep} from 'lodash/fp';
import { Navigation } from '../../../src/libs/utils';
import { Storage } from '../../../src/libs/storage';

let propCopy;
const collectionId = 1;
const refId1 = '0a4jn-g838d-bsdg8-6s7fs7';

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
  'hasVoted': false,
  'datasetCount': 4
};

const draftDarColl = {
  'darCollectionId': null,
  'referenceIds': [refId1],
  'darCode': 'DRAFT-023',
  'name': null,
  'submissionDate': '2022-07-26',
  'researcherName': null,
  'institutionName': null,
  'status': 'Draft',
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
  showConfirmationModal: () => {},
  history: {}
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
});

describe('Researcher Actions - Revise Button', () => {
  it('renders the revise button if the collection is revisable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Revise', 'Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-revise-${collectionId}`).should('exist');
  });
  it('does not render if the election is not revisable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-revise-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Review Button', () => {
  it('renders the review button if the collection is reviewable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Revise', 'Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-review-${collectionId}`).should('exist');
  });
  it('does not render if the election is not reviewable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Revise'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-review-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Resume Button', () => {
  it('renders the resume button if the collection is resumable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Resume', 'Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-resume-${collectionId}`).should('exist');
  });
  it('does not render if the election is not resumable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-resume-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Delete Button', () => {
  it('renders the delete button if the collection is deletable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Delete', 'Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-delete-${collectionId}`).should('exist');
  });
  it('does not render if the election is not deletable', () => {
    propCopy.consoleType = 'researcher';
    propCopy.actions = ['Review'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-delete-${collectionId}`).should('not.exist');
  });
});

describe('Researcher Actions - Draft', () => {
  it('uses the referenceId in id if draft', () => {
    propCopy.consoleType = 'researcher';
    propCopy.collection = draftDarColl;
    propCopy.actions = ['Revise', 'Resume', 'Review', 'Cancel', 'Delete'];
    mount(<Actions {...propCopy} />);
    cy.get(`#researcher-delete-${collectionId}`).should('not.exist');
    cy.get(`#researcher-resume-${refId1}`).should('exist');
    cy.get(`#researcher-review-${refId1}`).should('exist');
    cy.get(`#researcher-cancel-${refId1}`).should('exist');
    cy.get(`#researcher-delete-${refId1}`).should('exist');
    cy.get(`#researcher-revise-${refId1}`).should('exist');
  });
});

