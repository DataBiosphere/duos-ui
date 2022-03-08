/* eslint-disable no-undef */
import { React } from 'react';
import { mount } from '@cypress/react';
import AdminActions from '../../../src/components/dar_collection_table/AdminActions';

const collectionId = 1;
const props = {
  collection: {
    darCollectionId: collectionId,
    dars: {
      1: {
        elections: {
          1: {status: "Open"}
        }
      },
      2: {
        elections: {
          2: {status: "Closed"}
        }
      }
    }
  },
  showCancelModal: () => {},
  updateCollections: () => {},
};

describe('Admin Actions - Container', () => {
  it('renders the actions container div', () => {
    mount(<AdminActions {...props} />);
    const containerDiv = cy.get(`.admin-actions`);
    containerDiv.should('exist');
  });
});

describe('Admin Actions - Open Button', () => {
  it('renders the open button if some of the elections are not open', () => {
    mount(<AdminActions {...props} />);
    const button = cy.get(`#admin-open-${collectionId}`);
    button.should('exist');
  });
});

describe('Admin Actions - Closed button', () => {
  it('renders the cancel button if cancelable elections exists', () => {
    mount(<AdminActions {...props} />);
    const button = cy.get(`#admin-cancel-${collectionId}`);
    button.should('exist');
  });
});