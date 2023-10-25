/* eslint-disable no-undef */
import {compileSchema, validateForm} from '../../../src/pages/data_submission/RegistrationValidation.js';
import schema from '../../../src/assets/schemas/dataset-registration-schema_v1.json';

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
    'numberOfParticipants': 2,
    'consentGroupName': 'name',
    'generalResearchUse': true,
    'dataAccessCommitteeId': 1,
    'url': 'https://asdf.com'
  }]
};

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

  it('Validates a valid date field', () => {
    const form = Object.assign({}, formData, {targetDeliveryDate: '2021-01-01', targetPublicReleaseDate: '2021-01-01'});
    const [valid, validation] = validateForm(schema, form);
    expect(valid).to.be.true;
    expect(validation).to.be.empty;
  });

  it('Invalidates an invalid date field', () => {
    const form = Object.assign({}, formData, {targetDeliveryDate: '20210101', targetPublicReleaseDate: '20210101'});
    const [valid, validation] = validateForm(schema, form);
    expect(valid).to.be.false;
    expect(validation).to.not.be.empty;
  });

  it('Validates a valid email field', () => {
    const form = Object.assign({}, formData, {dataCustodianEmail: ['user@test.com']});
    const [valid, validation] = validateForm(schema, form);
    expect(valid).to.be.true;
    expect(validation).to.be.empty;
  });

  it('Invalidates an invalid email field', () => {
    const form = Object.assign({}, formData, {dataCustodianEmail: ['user']});
    const [valid, validation] = validateForm(schema, form);
    expect(valid).to.be.false;
    expect(validation).to.not.be.empty;
  });

  it('Validates a valid uri field', () => {
    const consentGroup = {
      'numberOfParticipants': 2,
      'consentGroupName': 'name',
      'generalResearchUse': true,
      'dataAccessCommitteeId': 1,
      'url': 'https://some.site.org'
    };
    const form = Object.assign({}, formData, {consentGroups: [consentGroup]});
    const [valid, validation] = validateForm(schema, form);
    expect(valid).to.be.true;
    expect(validation).to.be.empty;
  });

  it('Invalidates an invalid uri field', () => {
    const consentGroup = {
      'numberOfParticipants': 2,
      'consentGroupName': 'name',
      'generalResearchUse': true,
      'dataAccessCommitteeId': 1,
      'url': 'some place . org'
    };
    const form = Object.assign({}, formData, {consentGroups: [consentGroup]});
    const [valid, validation] = validateForm(schema, form);
    expect(valid).to.be.false;
    expect(validation).to.not.be.empty;
  });

});
