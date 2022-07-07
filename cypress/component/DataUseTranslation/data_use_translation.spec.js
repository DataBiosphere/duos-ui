/* eslint-disable no-undef */
import { processDefinedLimitations, consentTranslations } from '../../../src/libs/dataUseTranslation';
import { isEmpty, cloneDeep } from 'lodash/fp';

const mockDataUse = {
  diseaseRestrictions: []
};

describe('Data Use Translation', () => {
  describe('procesDefinedLimitations()', () => {
    it('translates Populations, Origins, and Ancestry (POA) if it has been marked in the data use', () => {
      const targetKey = 'populationOriginsAncestry';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {diseaseRestrictions: [], populationOriginsAncestry: true});
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      const targetTranslation = consentTranslations[targetKey];
      expect(!isEmpty(resp)).to.be.true;
      expect(resp.code).to.equal(targetTranslation.code);
      expect(resp.description).to.equal(targetTranslation.description);
    });

    it("translates HMB if it's been marked in the data use", () => {
      const targetKey = 'hmbResearch';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {[targetKey]: true, diseaseRestrictions: []});
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      const targetTranslation = consentTranslations[targetKey];
      expect(!isEmpty(resp)).to.be.true;
      expect(resp.code).to.equal(targetTranslation.code);
      expect(resp.description).to.equal(targetTranslation.description);
    });

    it('translates HMB if diseaseRestrictions is an empty array', () => {
      const targetKey = 'hmbResearch';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {diseaseRestrictions: [], [targetKey]: true});
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      const targetTranslation = consentTranslations[targetKey];
      expect(!isEmpty(resp)).to.be.true;
      expect(resp.code).to.equal(targetTranslation.code);
      expect(resp.description).to.equal(targetTranslation.description);
    });

    it('does not translate HMB if diseaseRestrictions is populated', () => {
      const targetKey = 'hmbResearch';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        diseaseRestrictions: ['test'],
        [targetKey]: true,
      });
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      expect(isEmpty(resp)).to.be.true;
    });

    it('translates General Research Use (GRU) if selected', () => {
      const targetKey = 'generalUse';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        diseaseRestrictions: []
      });
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      const targetTranslation = consentTranslations[targetKey];
      expect(!isEmpty(resp)).to.be.true;
      expect(resp.code).to.equal(targetTranslation.code);
      expect(resp.description).to.equal(targetTranslation.description);
    });

    it('does not translate GRU if HMB is selected', () => {
      const targetKey = 'generalUse';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        hmbResearch: true,
        diseaseRestrictions: []
      });
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      expect(isEmpty(resp)).to.be.true;
    });

    it('does not translate GRU if diseaseRestrictions is populated', () => {
      const targetKey = 'generalUse';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        diseaseRestrictions: ['test'],
      });
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      expect(isEmpty(resp)).to.be.true;
    });

    it('does not translate GRU if POA is selected', () => {
      const targetKey = 'generalUse';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        populationOriginsAncestry: true,
        diseaseRestrictions: []
      });
      const resp = processDefinedLimitations(targetKey, modifiedMockData, consentTranslations);
      expect(isEmpty(resp)).to.be.true;
    });

    it('translates Pediatric Studies (PSO) if pediatric is selected', () => {
      const targetKey = 'pediatric';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        diseaseRestrictions: [],
      });
      const resp = processDefinedLimitations(
        targetKey,
        modifiedMockData,
        consentTranslations
      );
      const targetTranslation = consentTranslations[targetKey];
      expect(!isEmpty(resp)).to.be.true;
      expect(resp.code).to.equal(targetTranslation.code);
      expect(resp.description).to.equal(targetTranslation.description);
    });

    it('translates Gender Studies (GSO) if gender is selected', () => {
      const targetKey = 'gender';
      const modifiedMockData = Object.assign(cloneDeep(mockDataUse), {
        [targetKey]: true,
        diseaseRestrictions: [],
      });
      const resp = processDefinedLimitations(
        targetKey,
        modifiedMockData,
        consentTranslations
      );
      const targetTranslation = consentTranslations[targetKey];
      expect(!isEmpty(resp)).to.be.true;
      expect(resp.code).to.equal(targetTranslation.code);
      expect(resp.description).to.equal(targetTranslation.description);
    });
  });
});