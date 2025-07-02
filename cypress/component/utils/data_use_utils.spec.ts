import {DatasetTerm} from 'src/types/model';
import {processDataUseCodes, createDataUseDisplay} from 'src/utils/DataUseUtils';
import {mount} from 'cypress/react';

describe('DataUseUtils', () => {
  describe('processDataUseCodes', () => {
    it('should process secondary data use codes correctly', () => {
      const dataset: Partial<DatasetTerm> = {
        datasetId: 4,
        datasetName: 'Test Dataset with Secondary',
        dataUse: {
          primary: [
            {code: 'GRU', description: 'General Research Use'}
          ],
          secondary: [
            {code: 'NPU', description: 'Not for Profit Use Only'}
          ]
        }
      };

      const result = processDataUseCodes(dataset as DatasetTerm);

      expect(result.codesAndDescriptions).to.have.length(2);
      expect(result.codesAndDescriptions[0].code).to.equal('GRU');
      expect(result.codesAndDescriptions[1].code).to.equal('NPU');

      expect(result.codeList).to.have.length(2);
      expect(result.codeList).to.deep.equal(['GRU', 'NPU']);
    });
  });

  describe('createDataUseDisplay', () => {
    it('should render data use display with correct codes', () => {
      const dataset: Partial<DatasetTerm> = {
        datasetId: 8,
        datasetName: 'Test Dataset for Display',
        dataUse: {
          primary: [
            {code: 'GRU', description: 'General Research Use'},
            {code: 'HMB', description: 'Health/Medical/Biomedical Research'}
          ],
          secondary: []
        }
      };

      mount(createDataUseDisplay({dataset: dataset as DatasetTerm}));

      cy.get('span').should('contain', 'GRU, HMB');
      cy.get('[data-for="dataset-data-use-8"]').should('exist');
    });
  });
});
