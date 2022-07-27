/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from 'cypress/react';
import Actions from '../../../src/components/dar_collection_table/Actions';
import {cloneDeep} from 'lodash/fp';
import { Navigation } from '../../../src/libs/utils';
import { Storage } from '../../../src/libs/storage';

let propCopy;
const collectionId = 1;
const collectionSkeleton = {
  darCollectionId: collectionId,
  dars: undefined
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
  collection: collectionSkeleton,
  showCancelModal: () => {},
  updateCollections: () => {}
};

beforeEach(() => {
  propCopy = cloneDeep(props);
  cy.stub(Navigation, 'console').returns({});
  cy.stub(Storage, 'getCurrentUser').returns(user);
});

describe('Chair Actions - Container', () => {
  it('renders the actions container div', () => {
    propCopy.collection.dars = votableDars;
    propCopy.relevantDatasets = [];
    mount(<Actions {...propCopy}/>);
    const container = cy.get('.chair-actions');
    container.should('exist');
  });
});

describe('Chair Actions - Open Button', () => {
  it('should render the open button if there is a an Open Action', () => {
    propCopy.collection.dars = nonOpenDars;
    propCopy.actions = ['Open'];
    mount(<Actions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('exist');
  });

  it('should not render if there is no valid election for opening/re-opening', () => {
    propCopy.actions = [];
    mount(<Actions {...propCopy} />);
    const openButton = cy.get(`#chair-open-${collectionId}`);
    openButton.should('not.exist');
  });
});

describe('Chair Actions - Close Button', () => {
  it('should render if there is a valid election for canceling (all open elections)', () => {
    propCopy.actions = ['Cancel'];
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

describe('Chair Actions - Vote Button', () => {
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



