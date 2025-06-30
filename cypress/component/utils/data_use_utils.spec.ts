import {DatasetTerm} from 'src/types/model';
import {processDataUseCodes, createDataUseDisplay} from 'src/utils/DataUseUtils';
import {mount} from 'cypress/react';

describe('DataUseUtils', () => {
  describe('processDataUseCodes', () => {
    it('should process primary data use codes correctly', () => {
      const dataset: Partial<DatasetTerm> = {
        datasetId: 1,
        datasetName: 'Test Dataset',
        dataUse: {
          primary: [
            {code: 'GRU', description: 'General Research Use'},
            {code: 'HMB', description: 'Health/Medical/Biomedical Research'}
          ],
          secondary: []
        }
      };

      const result = processDataUseCodes(dataset as DatasetTerm);

      expect(result.codesAndDescriptions).to.have.length(2);
      expect(result.codesAndDescriptions[0].code).to.equal('GRU');
      expect(result.codesAndDescriptions[0].description).to.equal('General Research Use');
      expect(result.codesAndDescriptions[1].code).to.equal('HMB');
      expect(result.codesAndDescriptions[1].description).to.equal('Health/Medical/Biomedical Research');

      // Check that the code list is correctly generated
      expect(result.codeList).to.have.length(2);
      expect(result.codeList).to.deep.equal(['GRU', 'HMB']);
    });

    it('should process primary OTHER codes correctly', () => {
      // Mock dataset with OTHER in primary codes
      const dataset: Partial<DatasetTerm> = {
        datasetId: 2,
        datasetName: 'Test Dataset with OTHER',
        dataUse: {
          primary: [
            {code: 'OTHER', description: 'Custom primary restriction'}
          ],
          secondary: []
        }
      };

      const result = processDataUseCodes(dataset as DatasetTerm);

      expect(result.codesAndDescriptions).to.have.length(1);
      expect(result.codesAndDescriptions[0].code).to.equal('OTH1');
      expect(result.codesAndDescriptions[0].description).to.equal('Custom primary restriction');

      expect(result.codeList).to.have.length(1);
      expect(result.codeList[0]).to.equal('OTH1');
    });

    it('should process DS disease codes correctly', () => {
      // Mock dataset with DS code
      const dataset: Partial<DatasetTerm> = {
        datasetId: 3,
        datasetName: 'Test Dataset with DS',
        dataUse: {
          primary: [
            {code: 'DS', description: 'Disease specific: Cancer'}
          ],
          secondary: []
        }
      };

      const result = processDataUseCodes(dataset as DatasetTerm);

      expect(result.codesAndDescriptions).to.have.length(1);
      expect(result.codesAndDescriptions[0].code).to.equal('DS (Cancer)');
      expect(result.codesAndDescriptions[0].description).to.equal('Disease specific: Cancer');

      expect(result.codeList).to.have.length(1);
      expect(result.codeList[0]).to.equal('DS (Cancer)');
    });

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
