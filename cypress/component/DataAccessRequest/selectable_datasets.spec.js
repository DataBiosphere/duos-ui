/* eslint-disable no-undef */
import {React} from 'react';
import {mount} from 'cypress/react';
import DataAccessRequestApplication from '../../../src/pages/dar_application/DataAccessRequestApplication';
import SelectableDatasets from '../../../src/pages/dar_application/SelectableDatasets.jsx';

const datasets = [
  {
    datasetId: 123456,
    datasetIdentifier: `DUOS-123456`,
    datasetName: 'Some Dataset 1'
  },
  {
    datasetId: 234567,
    datasetIdentifier: `DUOS-234567`,
    datasetName: 'Some Dataset 2'
  },
  {
    datasetId: 345678,
    datasetIdentifier: `DUOS-345678`,
    datasetName: 'Some Dataset 3'
  },
  {
    datasetId: 456789,
    datasetIdentifier: `DUOS-456789`,
    datasetName: 'Some Dataset 4'
  },
];

const props = {
  datasets: datasets, 
  setSelectedDatasets: () => {},
  disabled: false
};

const propsDisabled = {
  datasets: datasets, 
  setSelectedDatasets: () => {},
  disabled: true
};


describe('Selectable Datasets - Not Read Only', () => {

  describe('With 4 Datasets', () => {
    beforeEach(() => {
      mount(<SelectableDatasets {...props} />);
    });
  
    it('Marks 2 datasets for removal', () => {
      cy.get('#DUOS-123456_summary').click();
      cy.get('#DUOS-345678_summary').click();
      cy.get('#restore_dataset_123456').should('exist');
      cy.get('#restore_dataset_345678').should('exist');
    });
  
    it('Unmark 1 of the previously marked for removal datasets', () => {
      cy.get('#DUOS-123456_summary').click();
      cy.get('#DUOS-345678_summary').click();
      cy.get('#restore_dataset_123456').should('exist');
      cy.get('#restore_dataset_345678').should('exist');
      cy.get('#restore_dataset_345678').click();
      cy.get('#remove_dataset_345678').should('exist');
    });
  
    it('Marks 2 more datasets for removal, leaving 1 dataset left not removed', () => {
      cy.get('#DUOS-123456_summary').click();
      cy.get('#DUOS-345678_summary').click();
      cy.get('#restore_dataset_123456').should('exist');
      cy.get('#restore_dataset_345678').should('exist');
      cy.get('#restore_dataset_345678').click();
      cy.get('#remove_dataset_345678').should('exist');
      cy.get('#remove_dataset_345678').click();
      cy.get('#DUOS-234567_summary').click();
      cy.get('#restore_dataset_123456').should('exist');
      cy.get('#restore_dataset_345678').should('exist');
      cy.get('#restore_dataset_234567').should('exist');
      cy.get('#remove_dataset_456789').should('exist');
    });
  
    it('Cannot delete last dataset', () => {
      cy.get('#DUOS-123456_summary').click();
      cy.get('#DUOS-345678_summary').click();
      cy.get('#restore_dataset_123456').should('exist');
      cy.get('#restore_dataset_345678').should('exist');
      cy.get('#restore_dataset_345678').click();
      cy.get('#remove_dataset_345678').should('exist');
      cy.get('#remove_dataset_345678').click();
      cy.get('#DUOS-234567_summary').click();
      cy.get('#restore_dataset_123456').should('exist');
      cy.get('#restore_dataset_345678').should('exist');
      cy.get('#restore_dataset_234567').should('exist');
      cy.get('#remove_dataset_456789').should('exist');
      cy.get('#DUOS-456789_summary [data-testid="DeleteIcon"]').should('have.css', 'opacity', '0.5');
    });
  });

  describe('Selectable Datasets - Read Only', () => {
    beforeEach(() => {
      mount(<SelectableDatasets {...propsDisabled} />);
    });

    it('Can not click on any dataset', () => {
      cy.get('#DUOS-123456_summary').should('have.css', 'cursor', 'auto');
      cy.get('#DUOS-234567_summary').should('have.css', 'cursor', 'auto');
      cy.get('#DUOS-345678_summary').should('have.css', 'cursor', 'auto');
      cy.get('#DUOS-456789_summary').should('have.css', 'cursor', 'auto');
      
      cy.get('#DUOS-123456_summary').click();
      cy.get('#DUOS-234567_summary').click();
      cy.get('#DUOS-345678_summary').click();
      cy.get('#DUOS-456789_summary').click();

      cy.get('#restore_dataset_123456').should('not.exist');
      cy.get('#restore_dataset_234567').should('not.exist');
      cy.get('#restore_dataset_345678').should('not.exist');
      cy.get('#restore_dataset_456789').should('not.exist');

      cy.get('#DUOS-123456_summary').find('[data-testid="DeleteIcon"]').should('not.exist');
      cy.get('#DUOS-234567_summary').find('[data-testid="DeleteIcon"]').should('not.exist');
      cy.get('#DUOS-345678_summary').find('[data-testid="DeleteIcon"]').should('not.exist');
      cy.get('#DUOS-456789_summary').find('[data-testid="DeleteIcon"]').should('not.exist');
    });
  });
});

