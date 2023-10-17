/* eslint-disable no-undef */
import {compileSchema, validateForm} from '../../../src/pages/data_submission/RegistrationValidation.js';

const formData = {
  'studyType': 'Observational',
  'studyName': 'name',
  'studyDescription': 'description',
  'dataTypes': ['types'],
  'phenotypeIndication': 'phenotype',
  'species': 'species',
  'piName': 'PI Name',
  'dataCustodianEmail': ['email@abc.com'],
  'publicVisibility': true,
  'dataSubmitterUserId': 1,
  'nihAnvilUse': 'I am not NHGRI funded and do not plan to store data in AnVIL',
  'consentGroups': [{
    'fileTypes': [{
      'fileType': 'Arrays',
      'functionalEquivalence': 'equivalence'
    }],
    'numberOfParticipants': 2,
    'consentGroupName': 'name',
    'generalResearchUse': true,
    'dataAccessCommitteeId': 1,
    'url': 'https://asdf.com'
  }]
};

let schema = undefined;

beforeEach(function () {
  cy.fixture('dataset-registration-v1').then(function (schemaData) {
    schema = schemaData;
  });
});

describe('Dataset Registration Schema Validator', () => {

  it('Compiles schema and generates a validate function', () => {
    const validateFunction = compileSchema(schema);
    expect(validateFunction).to.not.be.null;
  });

  it('Validates a valid instance of a schema', () => {
    const [valid, validation] = validateForm(schema, formData);
    expect(valid).to.be.true;
    expect(validation).to.be.empty;
  });

  it('Invalidates an invalid instance of a schema', () => {
    const [valid, validation] = validateForm(schema, {});
    expect(valid).to.be.false;
    expect(validation).to.not.be.empty;
  });

});
