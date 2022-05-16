/* eslint-disable no-undef */
import CollectionAlgorithmDecision from '../../../src/components/CollectionAlgorithmDecision';
import { mount } from '@cypress/react';
import React from 'react';
import {formatDate} from '../../../src/libs/utils';

describe('CollectionAlgorithmDecision component', () => {
  it('renders a container with an id', () => {
    const id = 1;
    const props = {
      algorithmResult: {id}
    };
    mount(<CollectionAlgorithmDecision {...props}/>);

    const container = cy.get(`#collection-algorithm-id-${id}`);
    container.should('exist');
  });

  it('renders the decision label', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-decision-label`);
    container.should('exist');
    container.contains('Decision:');
  });

  it('renders the date label', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-date-label`);
    container.should('exist');
    container.contains('Date:');
  });

  it('renders the component subtitle', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-subtitle`);
    container.should('exist');
    container.contains('DUOS Algorithm Decision');
  });


  it('renders "N/A" if no result is provided', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: undefined,
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-decision-value`);
    container.should('exist');
    container.contains('N/A');
  });

  it('renders "Yes" if provided by algorithmResult', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'Yes',
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-decision-value`);
    container.should('exist');
    container.contains('Yes');
  });
  it('renders "No" if provided by algorithmResult', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-decision-value`);
    container.should('exist');
    container.contains('No');
  });

  it('renders createDate if provided by algorithmResult', () => {
    const createDate = new Date();
    const expectedDate = formatDate(createDate);
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'No',
        id,
        createDate,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-date-value`);
    container.should('exist');
    container.contains(expectedDate);
  });

  it('renders "N/A if createDate is not provided by algorithmResult', () => {
    const id = 1;
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    };
    mount(<CollectionAlgorithmDecision {...props} />);

    const container = cy.get(`#collection-${id}-date-value`);
    container.should('exist');
    container.contains('N/A');
  });

});
